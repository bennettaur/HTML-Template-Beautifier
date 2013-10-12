exports.isBlockTag = function (token){
    var openBlocks = ['autoescape','block','comment','filter','ifchanged','ifequal','ifnotequal','spaceless','verbatim','with','blocktrans','for','if'];
    var result = null;
    openBlocks.some(function (item){
        if (token.indexOf('end' + item) > -1){
            result = 'close';
            return true;
        } else if (token.indexOf(item) > -1){
            result = 'open';
            return true;
        }
        return false;
    })
    return result;
}

exports.isMiddleBlockTag = function (token){
    var middleBlocks = ['empty', 'elif', 'else'];
    var found = false;
    middleBlocks.some(function (item){
        if (token.indexOf(item) > -1){
            found = true;
            return found;
        }
    })
    return found;
}



exports.isSingleLineTag = function (token){
    var singleLines = ['csrf_token','cycle','load','debug','extends','firstof','include','now','regroup','ssi','templatetag','url','trans','widthratio','static','get_static_prefix','get_media_prefix'];
    var found = false;
    singleLines.some(function (item){
        if (token.indexOf(item) > -1){
            found = true;
            return found;
        }
        return false;
    })
    return found;
}