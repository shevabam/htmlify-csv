#!/usr/bin/env node

var http = require('http');
var path = require('path');
var fs = require('fs');
var parse = require('babyparse');

const app = require('caporal');
const opn = require('opn');


// Config parameters
const config = {
    'output_file': 'datas/output.html',
    'port': 8090
};

app
    .version('1.0.1')
    .description('htmlify-csv')
    .command('convert', 'Convert CSV file to HTML table')
    .argument('<file>', 'Input file (CSV) to render in HTML')
    .option('--delimiter <delimiter>', 'CSV delimiter', /(.*)/, ',')
    .option('--show', 'Open output file in browser')
    .option('--output <output>', 'Output filename', /(.*)/, config.output_file)
    .option('--port <port>', 'Server port number', app.INT, config.port)
    .action(function(args, options, logger) {

        // Define output filename
        var output_file = config.output_file;
        if (options.output)
            output_file = options.output;

        // Define server port number
        var port_number = config.port;
        if (options.port)
            port_number = options.port;

        // Read CSV file
        var file_content = fs.readFile(args.file, 'utf8', function(err, datas){

            // Parse CSV file
            var results = parse.parse(datas, {
                delimiter: options.delimiter,
                skipEmptyLines: true
            });

            var output = results.data;

            var columns = output[0];

            // Create HTML's table structure
            var html = '';

            html += "<table class=\"tablesorter\">\n";
            html += "\t<thead>\n";
            html += "\t\t<tr>\n";
            
            // Columns
            for (var i = 0; i < columns.length; i++)
            {
                html += "\t\t\t<th>"+columns[i]+"</th>\n";
            }

            html += "\t\t</tr>\n";
            html += "\t</thead>\n";
            
            html += "\t<tbody>\n";

            // Body
            for (i = 1; i < output.length; i++)
            {
                var rows = output[i];
                
                html += "\t\t<tr>\n";

                for (j = 0; j < rows.length; j++)
                {
                    html += "\t\t\t<td>"+rows[j]+"</td>\n";
                }

                html += "\t\t</tr>\n";
            }

            html += "\t</tbody>\n";
            html += "</table>\n";

            // Create full HTML code
            var generatedOutput = createTemplate(html);

            // Write HTML code in output file
            fs.writeFile(output_file, generatedOutput, function(err, data){

                // Open output in browser (option --show)
                if (options.show)
                {
                    // Create HTTP server with static files
                    http.createServer(function (request, response) {
                        var filePath = '.' + request.url;
                        if (filePath == './')
                            filePath = './'+output_file;
                        
                        var extname = path.extname(filePath);

                        var contentType = 'text/html';
                        switch (extname) {
                            case '.js':
                                contentType = 'text/javascript';
                                break;
                            case '.css':
                                contentType = 'text/css';
                                break;
                        }
                        
                        fs.exists(filePath, function(exists) {
                        
                            if (exists) {
                                fs.readFile(filePath, function(error, content) {
                                    if (error) {
                                        response.writeHead(500);
                                        response.end();
                                    }
                                    else {
                                        response.writeHead(200, { 'Content-Type': contentType });
                                        response.end(content, 'utf-8');
                                    }
                                });
                            }
                            else {
                                response.writeHead(404);
                                response.end();
                            }
                        });
                        
                    }).listen(port_number);

                    console.info('Server running at http://localhost:'+port_number+'/');
                
                    opn('http://localhost:'+port_number+'/');
                }
                else
                {
                    console.info('Output file: '+output_file);
                }

            });

        });

    });

app.parse(process.argv);


// Creates HTML's code
function createTemplate(table)
{
    var html = '';

    html += `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>CSV to HTML table - htmlify-csv</title>
        <link href="assets/css/jquery.tablesorter.theme.blue.css" rel="stylesheet">
        <style>
        html { font-family: Arial; font-size: 12px; }
        footer { font-size: 11px; }
        </style>
    </head>
    <body>

`;

    html += table;

    html += `
<footer>
    <p>Made by <a href="https://github.com/shevabam/htmlify-csv">htmlify-csv.js</a></p>
</footer>

<script src="assets/js/jquery-3.2.1.min.js"></script>
<script src="assets/js/jquery.tablesorter.min.js"></script>
<script src="assets/js/jquery.tablesorter.widgets.min.js"></script>
<script>
    $(document).ready(function(){
        var $table = $('table').tablesorter({
            theme: 'blue',
            widgets: ["zebra", "filter"],
            widgetOptions : {
                filter_columnFilters: true
            }
        });
    });
</script>
</body>
</html>`;

    return html;
}

