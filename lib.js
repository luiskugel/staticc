const fs = require("fs");
const sass = require("sass");

const importedFiles = [];
const importedImages = [];
let currentSnippet = "";

const transpile = (input_string, data, snippetPrefix) => {
  //splits text into normal html code and code snippets
  const [plainHTMLSnippets, codeSnippets] = seperateSnippets(input_string);
  //convertes code snippets to actual value
  const resolvedSnippets = resolveSnippets(codeSnippets, data, snippetPrefix);
  //recombines html with the resolved code snippets
  let result = resolvedSnippets.reduce((total, currentValue, currentIndex) => {
    return total + plainHTMLSnippets[currentIndex] + currentValue;
  }, "");
  result += plainHTMLSnippets[plainHTMLSnippets.length - 1];
  return result;
};

const seperateSnippets = (input_string) => {
  //count number of {{ => number of code blocks
  const oc = occurrences(input_string, "{{");
  const plainHTMLSnippets = [];
  const codeSnippets = [];
  //for every code block, get the plain html and the code block and add it to the lists
  for (let i = 0; i < oc; i++) {
    const [firstPart, middlePart, lastPart] = cutString(input_string);
    plainHTMLSnippets.push(firstPart);
    codeSnippets.push(middlePart);
    input_string = lastPart;
  }
  plainHTMLSnippets.push(input_string);
  return [plainHTMLSnippets, codeSnippets];
};

const occurrences = (string, subString) => {
  return string.split(subString).length - 1;
};

const cutString = (input_string) => {
  const openingIndex = input_string.indexOf("{{");
  const cloringIndex = input_string.indexOf("}}");
  const firstPart = input_string.slice(0, openingIndex);
  const middlePart = input_string.slice(openingIndex + 2, cloringIndex);
  const lastPart = input_string.slice(cloringIndex + 2);
  return [firstPart, middlePart, lastPart];
};

const resolveSnippets = (jsSnippets_array, data, snippetPrefix) => {
  return jsSnippets_array.map((snippet, index) => {
    index = index + 1
    console.log("Resolving Snippet: " + snippetPrefix + index)
    currentSnippet = snippet;
    const js = snippet.indexOf("#");
    const prefab = snippet.indexOf("!");
    const cmd = snippet.indexOf("?");

    if (js != -1) {
      const resolvedSnippet = resolveJsSnippet(snippet, data);
      return transpile(resolvedSnippet, data, snippetPrefix + index + ".");
    } else if (prefab != -1) {
      const resolvedSnippet = resolvePrefabSnippet(snippet, data);
      return transpile(resolvedSnippet, data, snippetPrefix + index + ".");
    } else if (cmd != -1) {
      const resolvedSnippet = resolveCmdSnippet(snippet);
      return transpile(resolvedSnippet, data, snippetPrefix + index + ".");
    } else {
      return resolveDataSnippet(snippet, data, snippetPrefix + index + ".");
    }
  });
};

const resolveJsSnippet = (snippet_string, data) => {
  //remove spaces and the #
  snippet_string = snippet_string.trim().replace("#", "");
  //run the js code and convert string array to array
  const evaluated_snippet = eval(snippet_string);
  return noramlizeJsReturns(evaluated_snippet);
};

const resolvePrefabSnippet = (snippet_string, data) => {
  //remove spaces and first !
  snippet_string = snippet_string.trim().replace("!", "");
  //check if its a js or html prefab
  if (snippet_string.indexOf("!") != -1) {
    //=> JS snippet
    //remove the second ! and seperate the path of the snippet from the args
    snippet_string_parts = snippet_string.replace("!", "").split(" ");
    snippet_path = snippet_string_parts.shift();
    //read in the file
    const jsFile = readFileFromDisk("prefabs/" + snippet_path + ".js");
    //parse the js code
    const evalResult = eval(jsFile);
    //run the render function with the provided args. Then convert string array to array if neccesary
    return noramlizeJsReturns(
      render(...decodePrefabArgs(snippet_string_parts, data))
    );
  } else {
    //=> HTML snippet
    //read in html file from disk and return it
    importedFiles.push("prefabs/" + snippet_string + ".html");
    return readFileFromDisk("prefabs/" + snippet_string + ".html");
  }
};

const resolveCmdSnippet = (snippet_string) => {
  //remove spaces and ?
  snippet_string_parts = snippet_string.trim().replace("?", "").split(" ");
  snippet_cmd = snippet_string_parts.shift();
  switch (snippet_cmd) {
    case "svg":
      return importSvg(...snippet_string_parts);
    case "css":
      return importCss(...snippet_string_parts);
    case "sass":
      return importSass(...snippet_string_parts);
    case "js":
      return importJs(...snippet_string_parts);
    case "img":
      return importImg(...snippet_string_parts);
    default:
      return "";
  }
};

const resolveDataSnippet = (snippet_string, data) => {
  let value = data;
  const snippetParts = snippet_string.replace(/\s/g, "").split(".");
  for (let i = 0; i < snippetParts.length; i++) {
    value = value[snippetParts];
  }
  return value;
};

const noramlizeJsReturns = (evaluated_snippet) => {
  //check if the evaluated snippet is a string which can be returned or if its an array which needs to be reduced
  if (evaluated_snippet.constructor == String) {
    return evaluated_snippet;
  } else if (evaluated_snippet.constructor == Array) {
    return evaluated_snippet.reduce((total, current) => {
      return total + current;
    });
  } else {
    throw new Error("only strings or array of strings are allowed");
  }
};

const decodePrefabArgs = (args, data) => {
  args = args.map((arg) => {
    if (arg == "") return null;
    if (arg.charAt(0) == '"') {
      arg = arg.substring(1, arg.length - 1);
      return arg;
    } else {
      return data[arg];
    }
  });
  return args;
};

const importSvg = (svgPath) => {
  importedFiles.push("src/" + svgPath);
  return readFileFromDisk("src/" + svgPath);
};

const importCss = (cssPath) => {
  importedFiles.push("src/" + cssPath);
  const styleSheet = readFileFromDisk("src/" + cssPath);
  return `<style>${styleSheet}</style>`;
};

const importSass = (sassPath) => {
  importedFiles.push("src/" + sassPath);
  var styleSheet = sass.renderSync({ file: "src/" + sassPath }).css.toString();
  return `<style>${styleSheet}</style>`;
};

const importJs = (jsPath) => {
  importedFiles.push("src/" + jsPath);
  const jsCode = readFileFromDisk("src/" + jsPath);
  return `<script>${jsCode}</script>`;
};

const importImg = (imgPath) => {
  importedImages.push("src/" + imgPath);
  const imagePathParts = imgPath.split(".");
  imagePathParts.pop();
  const imagepathWithoutExt = imagePathParts.join(".");
  return `
<picture>
  <source srcset='${imagepathWithoutExt}.webp' type='image/webp'>
  <source srcset='${imagepathWithoutExt}.jxr' type='image/vnd.ms-photo'>
  <source srcset='${imagepathWithoutExt}.jp2' type='image/jp2'>
  <img srcset='${imgPath}' alt='ein bild'>
</picture>`;
};

const readFileFromDisk = (filepath) => {
  //read file from disk
  return fs.readFileSync(filepath, {
    encoding: "utf8",
  });
};

const saveFileToDisk = (filepath, content) => {
  //save file to disk (+ create folders if neccesary)
  const folderpath = filepath
    .split("/")
    .splice(0, filepath.split("/").length - 1)
    .join("/");
  if (folderpath) fs.mkdirSync(folderpath, { recursive: true });
  fs.writeFileSync(filepath, content);
};

const getImportedFiles = () => {
  return importedFiles;
};

const getImportedImages = () => {
  return importedImages;
};

const getCurrentSnippet = () => {
  return currentSnippet;
};


exports.saveFileToDisk = saveFileToDisk;
exports.readFileFromDisk = readFileFromDisk;
exports.transpile = transpile;
exports.getImportedFiles = getImportedFiles;
exports.getImportedImages = getImportedImages;
exports.getCurrentSnippet = getCurrentSnippet;
