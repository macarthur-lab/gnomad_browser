/*
 *
 *
 * Coding Coordinates
 *
 *
 */

// this should be global - should not vary across installation
var EXON_PADDING = 75;

// todo: move this somewhere else
/*
    The following methods are for working with "Coding Coordinates",
    a coordinate space that we use to plot data in the coding regions of a transcript.

    Conceptually: suppose you lined up all the coding regions in a transcript, with some padding on each side,
    then plotted any variants that overlap. The position of a variant on this line is the coding position -
    this will obviously differ from the actual genomic or cds coordinates.

    Random notes:
        - coding coordinates have no concept of a gene - they are solely a property of a transcript
        - should probably have a map between coding coodinates and protein position
        - Brett, will you please write some fucking tests for this...

 */
 function renderAlleleFrequency(allele_frequency) {
    var frequency = Number(allele_frequency)
    if (frequency === 0) {
        return 0
    }
    else if (frequency >= 0.0001) {
        return frequency.toPrecision(4)
    } else {
        return Number(frequency.toPrecision(4)).toExponential()
    }
}


window.get_coding_coordinates = function(_transcript, position_list, skip_utrs) {
//    console.log(_transcript.exons);
    var exons;
    if (skip_utrs) {
        exons = _.filter(_transcript.exons, function(d) {
            return d.feature_type == 'CDS';
        });
    } else {
        exons = _.filter(_transcript.exons, function(d) {
            return d.feature_type == 'CDS' || d.feature_type == 'UTR';
        });
    }
    if (exons.length == 0) {
        exons = _transcript.exons;
    }
    var num_exons = exons.length;
    var exon_offsets = [];
    // initialize with one sided padding
    for (var i=0; i<num_exons; i++) {
        exon_offsets.push(EXON_PADDING);
    }
    for (var i=0; i<num_exons; i++) {
        for (var j=i+1; j<num_exons; j++) {
            exon_offsets[j] += exons[i]['stop'] - exons[i]['start'];
            if (skip_utrs || (i == num_exons - 1 || exons[i]['stop'] != exons[i+1]['start'] - 1)) {
                exon_offsets[j] += EXON_PADDING*2;
            }
        }
    }

    // get each position
    // todo: optimize by sorting positions
    var coding_positions = [];
    for (var i=0; i<num_exons; i++) {  // todo: underscore init method?
        coding_positions.push(-100);
    }
    _.each(position_list, function(position, i) {
        _.each(exons, function(exon, j) {
            if (position >= exon.start - EXON_PADDING && position <= exon.stop + EXON_PADDING) {
                coding_positions[i] = exon_offsets[j] + position - exon.start;
                return;
            }
        });
    });
    return coding_positions;
};

window.get_coding_coordinate = function(_transcript, position, skip_utrs) {
    return get_coding_coordinates(_transcript, [position], skip_utrs)[0];
};


window.get_coding_coordinate_params = function(_transcript, skip_utrs) {
    var ret = {};
    var exons;
    if (skip_utrs) {
        exons = _.filter(_transcript.exons, function(d) {
            return d.feature_type == 'CDS';
        });
    } else {
        exons = _.filter(_transcript.exons, function(d) {
            return d.feature_type == 'CDS' || d.feature_type == 'UTR';
        });
    }
    if (exons.length == 0) {
        exons = _transcript.exons;
    }
    ret.num_exons = exons.length;
    ret.size = EXON_PADDING;
    for (var i=0; i<ret.num_exons; i++) {
        ret.size += exons[i].stop - exons[i].start;
        if (skip_utrs || (i == ret.num_exons - 1 || exons[i]['stop'] != exons[i+1]['start'] - 1)) {
            ret.size += EXON_PADDING*2;
        }
    }
    ret.size -= EXON_PADDING;
    return ret;
};

window.precalc_coding_coordinates = function(_transcript, objects, key) {
    var orig_positions = _.map(objects, function(o) { return o[key] });
    var new_positions;
    new_positions = get_coding_coordinates(_transcript, orig_positions, false);
    _.each(objects, function(o, i) {
        o[key+'_coding'] = new_positions[i];
    });
    new_positions = get_coding_coordinates(_transcript, orig_positions, true);
    _.each(objects, function(o, i) {
        o[key+'_coding_noutr'] = new_positions[i];
    });
};

window.get_cnv = function(_cnvs, start, stop, type, filter_status){
    var r = 0;
    for (var i=0; i<_cnvs.length; i++) {
        if(_cnvs[i].start+1 == start || _cnvs[i].stop+1 == stop){
            if(filter_status)
		{
		    accessor = type + '0';
		}else{
                accessor = type + '60';
            }
            r =  _cnvs[i][accessor];
        }
    }
    return r;
};

window.get_cnv_pop = function(_cnvs, start, stop, type, filter_status){
    var r = 0;
    for (var i=0; i<_cnvs.length; i++) {
        if(_cnvs[i].start+1 == start || _cnvs[i].stop+1 == stop){
            if(filter_status)
		{
		    accessor = type + 'pop0';
		}else{
                accessor = type + 'pop60';
            }
            r =  _cnvs[i][accessor];
        }
    }
    return r;
};

window.get_max_cnv = function(_cnvs, filter_status){
    var r = 0;
    for (var i=0; i<_cnvs.length; i++) {
	if(filter_status){
	    var m = Math.max(_cnvs[i].del0, _cnvs[i].dup0);
	}else{
	    var m = Math.max(_cnvs[i].del60, _cnvs[i].dup60);
	}
	if( m > r){
	        r = m
		    }
    }
    return r;
};



/*
 *
 *
 * Other Stuff
 *
 *
 */

quality_chart_margin = {top: 10, right: 30, bottom: 45, left: 74};
quality_chart_height = 250 - quality_chart_margin.top - quality_chart_margin.bottom;
quality_chart_width = 300 - quality_chart_margin.left - quality_chart_margin.right;
xoffset = 40;
yoffset = 63;

function draw_quality_histogram(data, container, log, xlabel, ylabel) {
    //Takes histogram data as a list of [midpoint, value] and puts into container
    //If data already in container, transitions to new data
    var x;
    if (log) {
        x = d3.scale.log()
            .domain([d3.min(data, function (d) {
                return d[0];
            }), d3.max(data, function (d) {
                return d[0];
            })])
            .range([0, quality_chart_width]);
    } else {
        x = d3.scale.linear()
            .domain([d3.min(data, function (d) {
                return d[0];
            }), d3.max(data, function (d) {
                return d[0];
            })])
            .range([0, quality_chart_width]);
    }
    var bar_width = x(data[1][0]) - x(data[0][0]);
    var y = d3.scale.linear()
        .domain([d3.min(data, function(d) { return d[1]; }), d3.max(data, function(d) { return d[1]; })])
        .range([quality_chart_height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    var svg = d3.select(container);
    if (svg.selectAll('rect').length == 0 || svg.selectAll('rect')[0].length == 0) {
        svg = d3.select(container).append("svg")
            .attr("width", quality_chart_width + quality_chart_margin.left + quality_chart_margin.right)
            .attr("height", quality_chart_height + quality_chart_margin.top + quality_chart_margin.bottom)
            .append("g")
            .attr('id', 'inner_graph')
            .attr("transform", "translate(" + quality_chart_margin.left + "," + quality_chart_margin.top + ")");
        svg.append("text")
            .attr("class", "x label")
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .attr("x", quality_chart_width/2)
            .attr("y", quality_chart_height + xoffset)
            .text(xlabel);
        svg.append("text")
            .attr("class", "y label")
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .attr("transform", "rotate(-90)")
            .attr("x", -quality_chart_height/2)
            .attr("y", -yoffset)
            .text(ylabel);
        var bar = svg.selectAll(".bar")
            .data(data)
            .enter().append("g")
            .attr("class", "bar");

        bar.append("rect")
            .attr("x", function(d) { return x(d[0]); })
            .attr("width", bar_width)
            .attr("height", function(d) { return quality_chart_height - y(d[1]); })
            .attr("y", function(d) { return y(d[1]); });

        if (container == '#quality_metric_container') {
            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + quality_chart_height + ")")
                .style("font-size", "10px")
                .call(xAxis)
                .selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", function(d) {
                    return "rotate(-45)"
                });
            svg.append("g")
                .attr("class", "y axis")
                .style("font-size", "10px")
                .call(yAxis);
        } else {
            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + quality_chart_height + ")")
                .call(xAxis);
            svg.append("g")
                .attr("class", "y axis")
                .call(yAxis);
        }
    } else {
        svg = d3.select(container).select('svg').select('#inner_graph');

        if (container == '#quality_metric_container') {
            svg.select(".x.axis")
                .transition()
                .attr("transform", "translate(0," + quality_chart_height + ")")
                .call(xAxis)
                .selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", function(d) {
                    return "rotate(-45)"
                });
        } else {
            svg.select(".x.axis")
            .transition()
            .attr("transform", "translate(0," + quality_chart_height + ")")
            .call(xAxis);
        }

        svg.select(".y.axis")
            .transition()
            .call(yAxis);

        svg.select('.x.label')
            .text(xlabel);
        svg.select('.y.label')
            .text(ylabel);
        svg.selectAll('rect')
            .data(data)
            .transition()
            .duration(500)
            .attr("x", function(d) { return x(d[0]); })
            .attr("width", bar_width)
            .attr("height", function(d) { return quality_chart_height - y(d[1]); })
            .attr("y", function(d) { return y(d[1]); });
    }
}

function add_line_to_quality_histogram(data, position, container, log) {
    //Takes dataset (for range) and datapoint and draws line in container
    //If line is already in container, transitions to new line
    var low_value = d3.min(data, function (d) { return d[0]; });
    var high_value = d3.max(data, function (d) { return d[0]; });
    if (log) {
        xscale = d3.scale.log()
            .domain([low_value, high_value])
            .range([0, quality_chart_width]);
    } else {
        xscale = d3.scale.linear()
            .domain([low_value, high_value])
            .range([0, quality_chart_width]);
    }
    x = function(d) {
        var pos;
        if (d > high_value) {
            pos = xscale(high_value);
        } else if (d < low_value) {
            pos = xscale(low_value);
        } else {
            pos = xscale(d);
        }
        return pos;
    };
    var svg = d3.select(container).select('svg').select('#inner_graph');
    if (svg.selectAll('.line').length == 0 || svg.selectAll('.line')[0].length == 0) {
        var lines = svg.selectAll(".line")
                    .data([position])
                    .enter().append("g")
                    .attr("class", "line");
        lines.append('line')
                .attr("x1", function(d) { return x(d); })
                .attr("x2", function(d) { return x(d); })
                .attr("y1", quality_chart_height)
                .attr("y2", 0)
                .attr("stroke-width", 2)
                .attr("stroke", "red");
    } else {
        svg.selectAll('.line').select('line')
            .data([position])
            .transition()
            .duration(500)
            .attr("x1", function(d) { return x(d); })
            .attr("x2", function(d) { return x(d); })
            .attr("y1", quality_chart_height)
            .attr("y2", 0)
            .attr("stroke-width", 2)
            .attr("stroke", "red");
    }
}

function draw_region_coverage(raw_data_exomes, raw_data_genomes, metric, ref) {
    region_chart_width = 500;
    region_chart_margin = {top: 10, right: 50, bottom: 55, left: 50};
    if (raw_data_exomes.length > 1) {
        var data = raw_data_exomes;
        var chart_width = _.min([region_chart_width, data.length*30]);
        var x = d3.scale.linear()
            .domain([0, data.length])
            .range([0, chart_width]);

        var y = d3.scale.linear()
            .domain([0, d3.max(data, function(d) { return d[metric]; })])
            .range([quality_chart_height, 0]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");

        var svg = d3.select('#region_coverage_exomes');

        if (svg.selectAll('rect').length == 0 || svg.selectAll('rect')[0].length == 0) {
            svg = d3.select('#region_coverage_exomes').append("svg")
            .attr("width", chart_width  + region_chart_margin.left + region_chart_margin.right)
            .attr("height", quality_chart_height + region_chart_margin.top + region_chart_margin.bottom)
            .append("g")
            .attr('id', 'inner_graph')
            .attr("transform", "translate(" + region_chart_margin.left + "," + region_chart_margin.top + ")");

            var bar = svg.selectAll(".bar")
                .data(data)
                .enter().append("g")
                .attr("class", "bar");

            bar.append("rect")
                .attr("x", function(d, i) { return x(i); })
                .attr("width", chart_width/data.length - 1)
                .attr("height", function(d) { return quality_chart_height - y(d[metric]); })
                .attr("y", function(d) { return y(d[metric]); });

            xAxis = d3.svg.axis()
                .scale(x)
                .tickFormat(function(d) { return ref[d]; })
                .innerTickSize(0)
                .orient("bottom");

            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + quality_chart_height + ")")
                .call(xAxis);

            svg.append("g")
                .attr("class", "y axis")
                .call(yAxis);
        } else {
            svg = d3.select('#region_coverage_exomes').select('svg').select('#inner_graph');
            svg.select(".y.axis")
                .transition()
                .call(yAxis);

            svg.selectAll('rect')
                .data(data)
                .transition()
                .duration(500)
                .attr("x", function(d, i) { return x(i); })
                .attr("width", chart_width/data.length - 1)
                .attr("height", function(d) { return quality_chart_height - y(d[metric]); })
                .attr("y", function(d) { return y(d[metric]); });
        }
    } else {
        PADDING = 1;
        var data1 = {};
        $.each(raw_data_exomes[0], function(d, i) {
            var num = parseInt(d);
            if (!isNaN(num)) {
                data1[d] = raw_data_exomes[0][d];
            }
        });
        var data2 = {};
        data2['mean'] = raw_data_exomes[0]['mean'];
        data2['median'] = raw_data_exomes[0]['median'];

        var coverages = Object.keys(data1);
        var other_labels = Object.keys(data2);
        var all_labels = coverages.concat(Array.apply(null, Array(PADDING)).map(String.prototype.valueOf,""), other_labels);

        var chart_width = region_chart_width;
        var total_data_length = coverages.length + other_labels.length + PADDING;
        var x = d3.scale.linear()
            .domain([0, total_data_length])
            .range([0, chart_width]);

        var y1 = d3.scale.linear()
            .domain([0, d3.max(coverages, function(d) { return data1[d]; })])
            .range([quality_chart_height, 0]);

        var y2 = d3.scale.linear()
            .domain([0, d3.max(other_labels, function(d) { return data2[d]; })])
            .range([quality_chart_height, 0]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .tickFormat(function(d) { return all_labels[d - 1]; })
            .orient("bottom");

        var yAxis1 = d3.svg.axis()
            .scale(y1)
            .orient("left");

        var yAxis2 = d3.svg.axis()
            .scale(y2)
            .orient("right");

        svg = d3.select('#region_coverage_exomes').append("svg")
            .attr('id', 'inner_svg')
            .attr("width", chart_width + region_chart_margin.left + region_chart_margin.right)
            .attr("height", quality_chart_height + region_chart_margin.top + region_chart_margin.bottom)
            .append("g")
            .attr('id', 'inner_graph')
            .attr("transform", "translate(" + region_chart_margin.left + "," + region_chart_margin.top + ")");

        var bar = svg.selectAll(".bar")
            .data(coverages)
            .enter().append("g")
            .attr("class", "bar");

        bar.append("rect")
            .attr("x", function(d, i) { return x(i); })
            .attr("width", chart_width/total_data_length)
            .attr("height", function(d) { return quality_chart_height - y1(data1[d]); })
            .attr("y", function(d) { return y1(data1[d]); });

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + quality_chart_height + ")")
            .call(xAxis)
            .selectAll("text")
            .attr("transform", "translate(0, 10) rotate(45)");

        var bar = svg.selectAll(".bar").select('g')
            .data(other_labels)
            .enter().append("g")
            .attr("class", "bar");

        bar.append("rect")
            .attr("x", function(d, i) { return x(i + coverages.length + PADDING); })
            .attr("width", chart_width/total_data_length)
            .attr("height", function(d) { return quality_chart_height - y2(data2[d]); })
            .attr("y", function(d) { return y2(data2[d]); });

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis1);

        svg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + chart_width + " ,0)")
            .call(yAxis2);

        svg.append("text")
            .attr("class", "x label")
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .attr("x", region_chart_width/3)
            .attr("y", quality_chart_height + 50)
            .text(">= Coverage");
        svg.append("text")
            .attr("class", "y label")
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .attr("transform", "rotate(-90)")
            .attr("x", -quality_chart_height/2)
            .attr("y", -40)
            .text("Fraction individuals covered");
        svg.append("text")
            .attr("class", "y label")
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .attr("transform", "rotate(-90)")
            .attr("x", -quality_chart_height/2)
            .attr("y", region_chart_width+40)
            .text("Depth");
    }
    if (raw_data_genomes.length > 1) {
        var data = raw_data_genomes;
        var chart_width = _.min([region_chart_width, data.length*30]);
        var x = d3.scale.linear()
            .domain([0, data.length])
            .range([0, chart_width]);

        var y = d3.scale.linear()
            .domain([0, d3.max(data, function(d) { return d[metric]; })])
            .range([quality_chart_height, 0]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");

        var svg = d3.select('#region_coverage_genomes');

        if (svg.selectAll('rect').length == 0 || svg.selectAll('rect')[0].length == 0) {
            svg = d3.select('#region_coverage_genomes').append("svg")
            .attr("width", chart_width  + region_chart_margin.left + region_chart_margin.right)
            .attr("height", quality_chart_height + region_chart_margin.top + region_chart_margin.bottom)
            .append("g")
            .attr('id', 'inner_graph')
            .attr("transform", "translate(" + region_chart_margin.left + "," + region_chart_margin.top + ")");

            var bar = svg.selectAll(".bar")
                .data(data)
                .enter().append("g")
                .attr("class", "bar");

            bar.append("rect")
                .attr("x", function(d, i) { return x(i); })
                .attr("width", chart_width/data.length - 1)
                .attr("height", function(d) { return quality_chart_height - y(d[metric]); })
                .attr("y", function(d) { return y(d[metric]); })
                .style("fill", "rgba(115, 171, 61,  1")

            xAxis = d3.svg.axis()
                .scale(x)
                .tickFormat(function(d) { return ref[d]; })
                .innerTickSize(0)
                .orient("bottom");

            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + quality_chart_height + ")")
                .call(xAxis);

            svg.append("g")
                .attr("class", "y axis")
                .call(yAxis);
        } else {
            svg = d3.select('#region_coverage_genomes').select('svg').select('#inner_graph');
            svg.select(".y.axis")
                .transition()
                .call(yAxis);

            svg.selectAll('rect')
                .data(data)
                .transition()
                .duration(500)
                .attr("x", function(d, i) { return x(i); })
                .attr("width", chart_width/data.length - 1)
                .attr("height", function(d) { return quality_chart_height - y(d[metric]); })
                .attr("y", function(d) { return y(d[metric]); });
        }
    } else {
        PADDING = 1;
        var data1 = {};
        $.each(raw_data_genomes[0], function(d, i) {
            var num = parseInt(d);
            if (!isNaN(num)) {
                data1[d] = raw_data_genomes[0][d];
            }
        });
        var data2 = {};
        data2['mean'] = raw_data_genomes[0]['mean'];
        data2['median'] = raw_data_genomes[0]['median'];

        var coverages = Object.keys(data1);
        var other_labels = Object.keys(data2);
        var all_labels = coverages.concat(Array.apply(null, Array(PADDING)).map(String.prototype.valueOf,""), other_labels);

        var chart_width = region_chart_width;
        var total_data_length = coverages.length + other_labels.length + PADDING;
        var x = d3.scale.linear()
            .domain([0, total_data_length])
            .range([0, chart_width]);

        var y1 = d3.scale.linear()
            .domain([0, d3.max(coverages, function(d) { return data1[d]; })])
            .range([quality_chart_height, 0]);

        var y2 = d3.scale.linear()
            .domain([0, d3.max(other_labels, function(d) { return data2[d]; })])
            .range([quality_chart_height, 0]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .tickFormat(function(d) { return all_labels[d - 1]; })
            .orient("bottom");

        var yAxis1 = d3.svg.axis()
            .scale(y1)
            .orient("left");

        var yAxis2 = d3.svg.axis()
            .scale(y2)
            .orient("right");

        svg = d3.select('#region_coverage_genomes').append("svg")
            .attr('id', 'inner_svg')
            .attr("width", chart_width + region_chart_margin.left + region_chart_margin.right)
            .attr("height", quality_chart_height + region_chart_margin.top + region_chart_margin.bottom)
            .append("g")
            .attr('id', 'inner_graph')
            .attr("transform", "translate(" + region_chart_margin.left + "," + region_chart_margin.top + ")");

        var bar = svg.selectAll(".genomebar")
            .data(coverages)
            .enter().append("g")
            .attr("class", "genomebar")

        bar.append("rect")
            .attr("x", function(d, i) { return x(i); })
            .attr("width", chart_width/total_data_length)
            .attr("height", function(d) { return quality_chart_height - y1(data1[d]); })
            .attr("y", function(d) { return y1(data1[d]); })

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + quality_chart_height + ")")
            .call(xAxis)
            .selectAll("text")
            .attr("transform", "translate(0, 10) rotate(45)");

        var bar = svg.selectAll(".genomebar").select('g')
            .data(other_labels)
            .enter().append("g")
            .attr("class", "genomebar");

        bar.append("rect")
            .attr("x", function(d, i) { return x(i + coverages.length + PADDING); })
            .attr("width", chart_width/total_data_length)
            .attr("height", function(d) { return quality_chart_height - y2(data2[d]); })
            .attr("y", function(d) { return y2(data2[d]); });

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis1);

        svg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + chart_width + " ,0)")
            .call(yAxis2);

        svg.append("text")
            .attr("class", "x label")
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .attr("x", region_chart_width/3)
            .attr("y", quality_chart_height + 50)
            .text(">= Coverage");
        svg.append("text")
            .attr("class", "y label")
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .attr("transform", "rotate(-90)")
            .attr("x", -quality_chart_height/2)
            .attr("y", -40)
            .text("Fraction individuals covered");
        svg.append("text")
            .attr("class", "y label")
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .attr("transform", "rotate(-90)")
            .attr("x", -quality_chart_height/2)
            .attr("y", region_chart_width+40)
            .text("Depth");
    }
}

if (typeof Object.assign != 'function') {
  (function () {
    Object.assign = function (target) {
      'use strict';
      // We must check against these specific cases.
      if (target === undefined || target === null) {
        throw new TypeError('Cannot convert undefined or null to object');
      }

      var output = Object(target);
      for (var index = 1; index < arguments.length; index++) {
        var source = arguments[index];
        if (source !== undefined && source !== null) {
          for (var nextKey in source) {
            if (source.hasOwnProperty(nextKey)) {
              output[nextKey] = source[nextKey];
            }
          }
        }
      }
      return output;
    };
  })();
}

function update_variant_af_box() {
    function get_af_category(d) {
        if (d) {
            if (!d.allele_freq) {
                return [0, '0'];
            } else if (d.allele_count == 1) {
                return [1, 'a singleton'];
            } else if (d.allele_freq < 1/10000) {
                return [2, '<1/10000'];
            } else if (d.allele_freq < 1/1000) {
                return [3, '1/10000-0.001'];
            } else if (d.allele_freq < 1/100) {
                return [4, '0.001-0.01'];
            } else if (d.allele_freq < 1/20) {
                return [5, '0.01-0.05'];
            } else if (d.allele_freq < 1/2) {
                return [6, '0.05-0.5'];
            } else {
                return [7, '0.5-1'];
            }
        } else {
            return [0, '0']
        }
    }

    var data = window.table_variants;

    var width = 50;
    var height = 15;

    var x_scale = d3.scale.linear()
        .domain([0, 7])
        .range([0, width]);
    var exomeState = $('#exome_checkbox').is(":checked")
    var genomeState = $('#genome_checkbox').is(":checked")
    var dataSelection = getDataSelection(exomeState, genomeState)
    var svg;
    $.each(data, function(i, d) {
        // testing
        // if (d.variant_id === '22-46594241-G-T') {
        //     console.log(d.allele_freq)
        //     console.log(get_af_category(d)[0])
        //     console.log(d.all.allele_freq)
        //     console.log(get_af_category(d.all)[0])
        //     console.log(d.ExAC.allele_freq)
        //     console.log(get_af_category(d.ExAC)[0])
        //     console.log(d.gnomAD.allele_freq)
        //     console.log(get_af_category(d.gnomAD)[0])
        // }
        d3.select('#variant_af_box_' + d.variant_id.replace('*', 'star')).attr("data-tooltip", "Shows allele frequency \n on a discrete " +
                "scale: \n singletons, <1/10,000, \n <1/1000, <1%, <5%, \n <50%, >50%. \n This particular variant is \n " +
                get_af_category(d)[1] + ".");
        svg = d3.select('#variant_af_box_' + d.variant_id.replace('*', 'star'))
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g");

        for (var j=0; j<8; j++) {
            svg.append('rect')
                    .style('stroke', 'steelblue')
                    .style('fill', 'white')
                    .attr('x', x_scale(j))
                    .attr('y', 0)
                    .attr('height', height)
                    .attr('width', x_scale(1) - x_scale(0))
        }
        svg.append('rect')
            .style('fill', 'steelblue')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', function() {
                return x_scale(get_af_category(d[dataSelection])[0]);
            })
            .attr('height', height);

    });
}

var csq_order = [
    'transcript_ablation',
    'splice_acceptor_variant',
    'splice_donor_variant',
    'stop_gained',
    'frameshift_variant',
    'stop_lost',
    'start_lost',  // new in v81
    'initiator_codon_variant',  // deprecated
    'transcript_amplification',
    'inframe_insertion',
    'inframe_deletion',
    'missense_variant',
    'protein_altering_variant',  // new in v79
    'splice_region_variant',
    'incomplete_terminal_codon_variant',
    'stop_retained_variant',
    'synonymous_variant',
    'coding_sequence_variant',
    'mature_miRNA_variant',
    '5_prime_UTR_variant',
    '3_prime_UTR_variant',
    'non_coding_transcript_exon_variant',
    'non_coding_exon_variant',  // deprecated
    'intron_variant',
    'NMD_transcript_variant',
    'non_coding_transcript_variant',
    'nc_transcript_variant',  // deprecated
    'upstream_gene_variant',
    'downstream_gene_variant',
    'TFBS_ablation',
    'TFBS_amplification',
    'TF_binding_site_variant',
    'regulatory_region_ablation',
    'regulatory_region_amplification',
    'feature_elongation',
    'regulatory_region_variant',
    'feature_truncation',
    'intergenic_variant',
    ''
]

var categoryDefinitions = {
  all: csq_order,
  lof: csq_order.slice(0, csq_order.indexOf('stop_lost')),
  missense: csq_order.slice(
      csq_order.indexOf('stop_lost'),
      csq_order.indexOf('protein_altering_variant')
  ),
}
categoryDefinitions.missenseAndLof =
    categoryDefinitions.lof.concat(categoryDefinitions.missense)

function getDataSelection(exomeState, genomeState) {
    if (exomeState && genomeState) {
      return 'all'
    }
    if (exomeState && !genomeState) {
      return 'ExAC'
    }
    if (!exomeState && genomeState) {
      return 'gnomAD'
    }
}

function containsGenomeVariants(combined_variants_in_gene) {
    for (var i = 0; i < combined_variants_in_gene.length; i++) {
        if (combined_variants_in_gene[i].gnomAD) return true
    }
    return false
}

function update_variants() {
    var category = $('.consequence_display_buttons.active')
        .attr('id')
        .replace('consequence_', '')
        .replace('_variant_button', '');
    var filterState = $('#filtered_checkbox').is(":checked")
    var indelState = $('#indel_checkbox').is(":checked")
    var snpState = $('#snp_checkbox').is(":checked")
    var exomeState = $('#exome_checkbox').is(":checked")
    var genomeState = $('#genome_checkbox').is(":checked")
    var dataSelection = getDataSelection(exomeState, genomeState)
    $('[variant_id]').hide()
    if (dataSelection === 'all' && filterState) {
        $('.data-indicator-child').show()
    } else if (dataSelection === 'all' && !filterState) {
        $('.data-indicator-child').hide()
        $('.data-indicator-child.label-success').show()
    } else {
        $('.data-indicator-child').hide()
        $('.data-indicator-' + dataSelection).show()
    }
    $('[variant_id]').map(function(i) {
        var variant_id = $(this).attr('variant_id')
        var variant = window.table_variants.find(function(v) { return v.variant_id === variant_id })
        if (!snpState && $(this).attr('indel') === 'false') {
            return
        }
        if (!indelState && $(this).attr('indel') === 'true') {
            return
        }
        if (!_.contains(categoryDefinitions[category], $(this).attr('major_consequence'))) {
            return
        }
        if (!variant[dataSelection] ) {
            return
        }
        if (dataSelection !== 'all'
            && !filterState
            && variant[dataSelection].filter !== 'PASS') {
            return
        }
        if (dataSelection === 'all'
            && !filterState
            && variant.pass !== 'all'
        ) {
            if (variant.pass === 'none') {
                return
            }
            variant = Object.assign({}, variant, { all: variant[variant.pass] })
        }
        // console.log(window.width())
        $(this).find('.table-allele-count').html(variant[dataSelection].allele_count)
        $(this).find('.table-allele-num').html(variant[dataSelection].allele_num)
        $(this).find('.table-hom-count').html(variant[dataSelection].hom_count)
        $(this).find('.table-hemi-count').html(variant[dataSelection].hemi_count)
        // $(this).find('.table-allele-freq').html(variant[dataSelection].allele_freq.toPrecision(4))
        $(this).find('.table-allele-freq').html(renderAlleleFrequency(variant[dataSelection].allele_freq))
        $(this).find('.table-allele-freq-box').empty()
        Object.keys(variant[dataSelection].pop_acs).map(function(pop) {
            $('#td-pop-acs-' + pop.replace(/[\s()]/g, '') + variant.variant_id).html(variant[dataSelection].pop_acs[pop])
            $('#td-pop-ans-' + pop.replace(/[\s()]/g, '') + variant.variant_id).html(variant[dataSelection].pop_ans[pop])
            $('#td-pop-homs-' + pop.replace(/[\s()]/g, '') + variant.variant_id).html(variant[dataSelection].pop_homs[pop])
        })
        $(this).show()
    })
    if ($(window).width() < 768) {
        cnv_chart_margin.left = 10;
        // $(this).find('table-head-variant').text('')
        $('#th-hgvs').html('Conseq.')
        $('#th-vep').html('Annot.')
        $('#th-ac').html('Count')
        // $('#table-head-an').html('AN')
        $('#th-af').html('Freq.')
        // $('#table-head-hom').html('HOM')
        // $('#table-head-hem').html('HEMI')
    }
    update_variant_af_box()
    if ($('tr[style!="display: none;"]').length == 1) {
        $('#variants_table_empty').show();
        $('#variants_table_container').hide();
    } else {
        $('#variants_table_empty').hide();
        $('#variants_table_container').show();
    }
}

function update_cnvs() {
    var filter = $('#filtered_checkbox').is(":checked") ? '[filter_status]' : '[filter_status="PASS"]';
}

function get_af_bounds(data) {
    // Removing AC_Adj = 0 cases
    var min_af = d3.min(data, function(d) {
        if (d.allele_freq > 0) {
            return d.allele_freq;
        } else {
            return 1;
        }
    });
    // Should this be 1?
    var max_af = d3.max(data, function(d) { return d.allele_freq; });
    return [min_af, max_af];
}

total_width = $(window).width() < 768 ? $(window).width() : $(window).width() * 10 / 12;

gene_chart_margin = {top: 10, right: 10, bottom: 5, left: 30};
if ($(window).width() < 768) {
    gene_chart_margin.left = 10;
}
gene_chart_margin_lower = {top: 5, right: gene_chart_margin.right, bottom: 5, left: gene_chart_margin.left},
    gene_chart_width = total_width - gene_chart_margin.left - gene_chart_margin.right;

lower_gene_chart_height = 50 - gene_chart_margin_lower.top - gene_chart_margin_lower.bottom,
    gene_chart_height = 300 - gene_chart_margin.top - gene_chart_margin.bottom - lower_gene_chart_height - gene_chart_margin_lower.top - gene_chart_margin_lower.bottom;

cnv_chart_margin = {top: 30, right: gene_chart_margin.right, bottom: gene_chart_margin.bottom, left: gene_chart_margin.left};


function change_track_chart_variant_size(variant_data, change_to, container) {
    var svg_outer = d3.select(container).select('#track');

    var variant_size_scale;
    var bounds = get_af_bounds(variant_data);
    var min_af = bounds[0];
    var max_af = bounds[1];
    if (change_to) {
        variant_size_scale = d3.scale.log()
            .domain([min_af, max_af])
            .range([lower_gene_chart_height / 3, 2]);
    } else {
        variant_size_scale = d3.scale.log()
            .domain([min_af, max_af])
            .range([2, lower_gene_chart_height / 3]);
    }
    svg_outer.selectAll("a")
        .selectAll("ellipse")
        .transition()
        .duration(500)
        .attr("ry", function(d, i) {
            if (!d.allele_freq) {
                return 0;
            } else {
                return variant_size_scale(d.allele_freq);
            }
        });
}

function memorySizeOf(obj) {
    var bytes = 0;

    function sizeOf(obj) {
        if(obj !== null && obj !== undefined) {
            switch(typeof obj) {
            case 'number':
                bytes += 8;
                break;
            case 'string':
                bytes += obj.length * 2;
                break;
            case 'boolean':
                bytes += 4;
                break;
            case 'object':
                var objClass = Object.prototype.toString.call(obj).slice(8, -1);
                if(objClass === 'Object' || objClass === 'Array') {
                    for(var key in obj) {
                        if(!obj.hasOwnProperty(key)) continue;
                        sizeOf(obj[key]);
                    }
                } else bytes += obj.toString().length * 2;
                break;
            }
        }
        return bytes;
    };

    function formatByteSize(bytes) {
        if(bytes < 1024) return bytes + " bytes";
        else if(bytes < 1048576) return(bytes / 1024).toFixed(3) + " KiB";
        else if(bytes < 1073741824) return(bytes / 1048576).toFixed(3) + " MiB";
        else return(bytes / 1073741824).toFixed(3) + " GiB";
    };

    return formatByteSize(sizeOf(obj));
}

// Adapted from http://jsfiddle.net/terryyounghk/KPEGU/
function exportTableToCSV($table, filename) {

    var $rows = $table.find('tr:has(td,th)[style!="display: none;"]'),

        // Temporary delimiter characters unlikely to be typed by keyboard
        // This is to avoid accidentally splitting the actual contents
        tmpColDelim = String.fromCharCode(11), // vertical tab character
        tmpRowDelim = String.fromCharCode(0), // null character

        // actual delimiter characters for CSV format
        colDelim = '","',
        rowDelim = '"\r\n"',

        // Grab text from table into CSV formatted string
        csv = '"' + $rows.map(function (i, row) {
            var $row = $(row),
                $cols = $row.find('td,th').not('.omit_csv');

            return $cols.map(function (j, col) {
                var $col = $(col),
                    text = $col.text();

                return text.replace('"', '""').replace(/\s+/g, " ").replace(/^\s+/, "").replace(/\s+$/, ""); // escape double quotes

            }).get().join(tmpColDelim);

        }).get().join(tmpRowDelim)
            .split(tmpRowDelim).join(rowDelim)
            .split(tmpColDelim).join(colDelim) + '"',

        // Data URI
        csvData = 'data:application/csv;charset=utf-8,' + encodeURIComponent(csv);

    $(this)
        .attr({
        'download': filename,
            'href': csvData,
            'target': '_blank'
    });
}
function pad_2(number) { return (number < 10 ? '0' : '') + number; }

function date_format(date) {
     return date.getFullYear() + '_' +
         pad_2(date.getMonth()+1) + '_' +
         pad_2(date.getDate()) + '_' +
            pad_2(date.getHours()) + '_' +
            pad_2(date.getMinutes()) + '_' +
            pad_2(date.getSeconds()) ;
}

function set_plot_image(container, index) {
    //get svg element.
    var svg = $('#' + container).find('svg')[index];
    //get svg source.
    var serializer = new XMLSerializer();
    var source = serializer.serializeToString(svg);

    //add name spaces.
    if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if(!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)){
        source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }

    //add xml declaration
    source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

    //convert svg source to URI data scheme.
    return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(source);
}
