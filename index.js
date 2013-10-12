var beautify_html = require('js-beautify').html,
    fs = require('fs'),
    Transform = require('stream').Transform,
    tags = require('./tags'),
    utils = require('./utils');

var inFile = process.argv[2];
preProcess(inFile);

function preProcess(filename){

    preprocess_out_file = filename + '-pre'

    var instream = fs.createReadStream(filename);
    var outstream = fs.createWriteStream(preprocess_out_file)

    var buffer = '';
    var parser = new Transform();

    parser._transform = function(data, encoding, done) {
        var new_buffer = buffer + data;
        var lines = new_buffer.split("\n");

        if (lines.length > 1){
            var last = lines.pop();
            if (utils.endsWith(last, "\n")){
                lines.push(last);
            } else {
                buffer = last;
            }
        }

        for (var i = 0; i < lines.length; i++){
            if (lines[i] === undefined){
                continue;
            }
            this.push(preProcessLine(lines[i]))
        }
        done();
    }

    parser._flush = function(done){
        this.push(preProcessLine(buffer));
        done();
    }
    instream.pipe(parser).pipe(outstream);
    outstream.on("finish", function(){
        beautify(filename);
    })

}

function preProcessLine(line){
    var regex = /\{\%\s*.*?\s*\%\}/g
    var results = line.match(regex)
    if (results !== null && results.length >= 0) {
        var new_line = line.replace(regex, '::?pl?::');
        var tokens = new_line.split('::')

        for (var i = 0; i < tokens.length; i++){
            if (tokens[i] === '?pl?'){
                var tag = results.shift();
                var out = '';
                if (tags.isSingleLineTag(tag)){
                    out = '<templatetag code="' + tag + '"/>';
                } else if (tags.isMiddleBlockTag(tag)){
                    out = '</templatetag code="' + tag + '"><templatetag code="">';
                } else {
                    var blockType = tags.isBlockTag(tag);
                    if (blockType === 'open'){
                        out = '<templatetag code="' + tag + '">';
                    } else if (blockType === 'close'){
                        out = '</templatetag code="' + tag + '">';
                    }
                }
                if (out.length > 0){
                    tokens[i] = out
                }
            }

        }

        return tokens.join('') + '\n';
        //output.write(finalLine + '\n');
    } else {
        return line + '\n';
        //output.write(line + '\n');
    }
}

function beautify(baseFilename) {
    var filename = baseFilename + '-pre';
    fs.readFile(filename, 'utf8', function (err, data) {
        if (err) {
            throw err;
        }
        var beautified = beautify_html(data, { indent_size: 4 });

        fs.writeFile(baseFilename + '-beau', beautified, function(){
            postProcess(baseFilename);
        });
    });
}

function postProcess(baseFilename) {
    var postProcessOutFile = 'beautified-' + baseFilename
    var filename = baseFilename + '-beau'
    var instream = fs.createReadStream(filename);
    var outstream = fs.createWriteStream(postProcessOutFile)

    var buffer = '';
    var parser = new Transform();

    parser._transform = function(data, encoding, done) {
        var lines = (buffer + data).split("\n");

        if (lines.length > 1){
            var last = lines.pop();
            if (utils.endsWith(last, "\n")){
                lines.push(last);
            } else {
                buffer = last;
            }
        }

        for (var i = 0; i < lines.length; i++){
            if (lines[i] === undefined){
                continue;
            }
            this.push(postProcessLine(lines[i]))
        }
        done();
    }

    parser._flush = function(done){
        this.push(postProcessLine(buffer));
        done();
    }
    instream.pipe(parser).pipe(outstream);
    outstream.on("finish", function(){
        cleanUp(baseFilename);
    })
}

function postProcessLine(line){
    var regex = /<\/?templatetag code="(.*?)"\/?>/g
    var results = utils.getMatches(line, regex, 1)

    if (results !== null && results.length >= 0) {

        var tokens = line.replace(regex, '::?pl?::').split('::')

        for (var i = 0; i < tokens.length; i++){
            if (tokens[i] === '?pl?'){
                var tag = results.shift();
                tokens[i] = tag
            }
        }

        return tokens.join('') + '\n';
    } else {
        return line + '\n';
    }
}

function cleanUp(baseFilename){
    fs.unlinkSync(baseFilename + '-pre');
    fs.unlinkSync(baseFilename + '-beau');
    console.log("Done!");
}
