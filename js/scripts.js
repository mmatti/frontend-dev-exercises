// Size and margins
var mrg = {top:20,right:65,bottom:20,left:45},
	wdt = 1024 - mrg.left - mrg.right,
	hgt = 512 - mrg.top - mrg.bottom;

// Define the X/Y ranges
var x = d3.scaleBand()
	.range([0,wdt])
	.padding(0.2);
var y = d3.scaleLinear()
	.range([hgt,0]);

// Add group element to SVG, then pin it to the top-left margin
var edu = d3.select('#edu')
	.attr('width',wdt + mrg.left + mrg.right)
	.attr('height',hgt + mrg.top + mrg.bottom)
	.append('g')
	.attr('transform','translate('+mrg.left+','+mrg.top+')');

var eth = d3.select('#eth')
	.attr('width',wdt + mrg.left + mrg.right)
	.attr('height',hgt + mrg.top + mrg.bottom)
	.append('g')
	.attr('transform','translate('+mrg.left+','+mrg.top+')');

var cmb = d3.select('#cmb')
	.attr('width',wdt + mrg.left + mrg.right)
	.attr('height',hgt + mrg.top + mrg.bottom)
	.append('g')
	.attr('transform','translate('+mrg.left+','+mrg.top+')');

// Semi-official long-label wrapping kludge, from Mike Bostock himself: <http://bl.ocks.org/mbostock/7555321>
function wrap(text,width){
	text.each(function() {
		var text = d3.select(this),
			words = text.text().split(/\s+/).reverse(),
			word,
			line = [],
			lineNumber = 0,
			lineHeight = 1.1,
			y = text.attr('y'),
			dy = parseFloat(text.attr('dy')),
			tspan = text.text(null).append('tspan').attr('x',0).attr('y',y).attr('dy',dy+'em');
		while(word = words.pop()){
			line.push(word);
			tspan.text(line.join(' '));
			if(tspan.node().getComputedTextLength() > width){
				line.pop();
				tspan.text(line.join(' '));
				line = [word];
				tspan = text.append('tspan').attr('x',0).attr('y',y).attr('dy',++lineNumber*lineHeight+dy+'em').text(word);
			}
		}
	});
}

// Horizontal grid line generator
function yGrid(n){
	return d3.axisLeft(y).ticks(n);
}

// The color of money ...
var mnyCol = 'rgb(0,158,115)';

// Explicit categories are needed: neither D3's default of order-by-occurrence nor an alphabetical sort will give us expected progressions. By convention, we'd want education to progress from minimal to maximal, and race from majority to minority with "other" tacked on at the end.
var eduDom = [
	'Did not complete high school',
	'High school',
	'Some college',
	'Associates',
	'Bachelors',
	'Masters',
	'Doctorate',
	'Professional school'
];
var ethDom = [
	'White',
	'Black',
	'Asian-Pac-Islander',
	'Amer-Indian-Eskimo',
	'Other'
];

// Fetch the CSV data file
d3.csv('./census.csv',function(err,data){
	if(err){
		throw err;
	}
	// Extract what we actually want to work with
	data.forEach(function(d,i){
		// Simple in-line data hygiene check; presumably, data would be cleaned up before handed to this chart ...
		if((d.over_50k == 0 && d.over_50k_text != 'False') || (d.over_50k == 1 && d.over_50k_text != 'True')) {
			console.log('Warning: entry #'+(i+1)+' has mismatched numeric/text values: '+d.over_50k+' ≠ '+d.over_50k_text);
		}
		// Cast CSV string values to numeric
		d.age = +d.age;
		d.over_50k = +d.over_50k;
	});

	// BEGIN EDUCATION

	// Need to derive the average of 0/1 responses to over_50k, per education_level
	var edu50k = d3.nest()
		.key(function(d){
			return d.education_level;
		})
		.rollup(function(v){
			return d3.mean(v,function(d){
				return d.over_50k;
			});
		})
		.entries(data);

	// X domain was defined earlier; Y domain needs to run from +100% to -100%
	x.domain(eduDom);
	y.domain([-1,1]);

	// Add the over/under bars: it's a single data series drawn twice (animated!), placing 1-mean under the axis
	edu.selectAll()
		.data(edu50k)
		.enter()
		.append('rect')
		.attr('x',function(d){
			return x(d.key);
		})
		.attr('width',x.bandwidth())
		.attr('y',hgt/2)
		.attr('height',0)
		.style('fill',mnyCol)
		.transition().duration(400)
			.attr('y',function(d){
				return y(d.value);
			})
			.attr('height',function(d){
				return hgt - y(d.value - 1);
			});
	edu.selectAll()
		.data(edu50k)
		.enter()
		.append('rect')
		.attr('x',function(d){
			return x(d.key);
		})
		.attr('width',x.bandwidth())
		.attr('y',y(0))
		.style('fill',mnyCol)
		.style('opacity',0.6)
		.transition().duration(400)
			.attr('height',function(d){
				return hgt - y((1 - d.value) - 1);
			});

	// Apply the X/Y axes, title, and notes
	edu.append('g')
		.attr('class','grid')
		.call(yGrid(20).tickSize(-wdt).tickFormat(''));
	edu.append('g')
		.attr('class','xAxis')
		.attr('transform','translate(0,'+(hgt/2)+')')
		.call(d3.axisBottom(x).tickSizeOuter(0))
		.selectAll(".tick text")
		.call(wrap,x.bandwidth());
	edu.append('g')
		.call(d3.axisLeft(y).tickArguments([20,'+p']));
	edu.append('text')
		.attr("class", "title")
		.attr('x',30)
		.attr('y',40)
		.text('Percentage of people earning above/below $50K, by education level');
	edu.append('text')
		.attr('class','note')
		.attr('x',wdt+4)
		.attr('y',(hgt/2)-20)
		.attr('dy','1em')
		.text('👤 ⬆ $50K');
	edu.append('text')
		.attr('class','note')
		.attr('x',wdt+4)
		.attr('y',(hgt/2)+20)
		.text('👤 ⬇ $50K');

	//BEGIN RACE

	// Need to derive the average of 0/1 responses to over_50k, per race
	var eth50k = d3.nest()
		.key(function(d){
			return d.race;
		})
		.rollup(function(v){
			return d3.mean(v,function(d){
				return d.over_50k;
			});
		})
		.entries(data);

	// X domain was defined earlier; Y domain needs to run from +100% to -100%
	x.domain(ethDom);
	y.domain([-1,1]);

	// Add the over/under bars: it's a single data series drawn twice (animated!), placing 1-mean under the axis
	eth.selectAll()
		.data(eth50k)
		.enter()
		.append('rect')
		.attr('x',function(d){
			return x(d.key);
		})
		.attr('width',x.bandwidth())
		.attr('y',hgt/2)
		.attr('height',0)
		.style('fill',mnyCol)
		.transition().duration(400)
			.attr('y',function(d){
				return y(d.value);
			})
			.attr('height',function(d){
				return hgt - y(d.value - 1);
			});
	eth.selectAll()
		.data(eth50k)
		.enter()
		.append('rect')
		.attr('x',function(d){
			return x(d.key);
		})
		.attr('width',x.bandwidth())
		.attr('y',y(0))
		.style('fill',mnyCol)
		.style('opacity',0.6)
		.transition().duration(400)
			.attr('height',function(d){
				return hgt - y((1 - d.value) - 1);
			});

	// Apply the X/Y axes, title, and notes
	eth.append('g')
		.attr('class','grid')
		.call(yGrid(20).tickSize(-wdt).tickFormat(''));
	eth.append('g')
		.attr('class','xAxis')
		.attr('transform','translate(0,'+(hgt/2)+')')
		.call(d3.axisBottom(x).tickSizeOuter(0))
		.selectAll(".tick text")
		.call(wrap,x.bandwidth());
	eth.append('g')
		.call(d3.axisLeft(y).tickArguments([20,'+p']));
	eth.append('text')
		.attr("class", "title")
		.attr('x',30)
		.attr('y',40)
		.text('Percentage of people earning above/below $50K, by race');
	eth.append('text')
		.attr('class','note')
		.attr('x',wdt+4)
		.attr('y',(hgt/2)-20)
		.attr('dy','1em')
		.text('👤 ⬆ $50K');
	eth.append('text')
		.attr('class','note')
		.attr('x',wdt+4)
		.attr('y',(hgt/2)+20)
		.text('👤 ⬇ $50K');

	// BEGIN COMBO

	// Color-blind-friendly codes for race values: <http://mkweb.bcgsc.ca/colorblind/>
	var ethCol = d3.scaleOrdinal()
		.range(['rgb(230,159,0)','rgb(86,180,233)','rgb(213,94,0)','rgb(0,114,178)','rgb(204,121,167)']);

	// Need to derive the average of 0/1 responses to over_50k, per education_level
	var cmb50k = d3.nest()
		.key(function(d){
			return d.education_level;
		})
		.key(function(d){
			return d.race;
		})
		.rollup(function(v){
			return d3.mean(v,function(d){
				return d.over_50k;
			});
		})
		.entries(data);

	// X domain was defined earlier; Y domain needs to run from +100% to -100%
	x.domain(eduDom);
	y.domain([-1,1]);
	// X scaling for sub-groups within categories
	var xSub = d3.scaleBand()
		.range([0,x.bandwidth()])
		.padding(0.1)
		.domain(ethDom);

	// Add the over/under bars: it's a grouped data series drawn twice (animated!), placing 1-mean under the axis
	var cat = cmb.selectAll()
		.data(cmb50k)
		.enter()
		.append('g')
		.attr('class','cat')
		.attr('transform',function(d){
			return 'translate('+x(d.key)+',0)';
		});
	cat.selectAll()
		.data(function(d){
			return d.values;
		})
		.enter()
		.append('rect')
		.attr('x',function(d){
			return xSub(d.key);
		})
		.attr('width',xSub.bandwidth())
		.attr('y',hgt/2)
		.attr('height',0)
		.style('fill',function(d){
			return ethCol(d.key);
		})
		.transition().duration(400)
			.attr('y',function(d){
				return y(d.value);
			})
			.attr('height',function(d){
				return hgt - y(d.value - 1);
			});
	cat.selectAll()
		.data(function(d){
			return d.values;
		})
		.enter()
		.append('rect')
		.attr('x',function(d){
			return xSub(d.key);
		})
		.attr('width',xSub.bandwidth())
		.attr('y',y(0))
		.style('fill',function(d){
			return ethCol(d.key);
		})
		.style('opacity',0.6)
		.transition().duration(400)
			.attr('height',function(d){
				return hgt - y((1 - d.value) - 1);
			});

	// Apply the X/Y axes, title, and notes
	cmb.append('g')
		.attr('class','grid')
		.call(yGrid(20).tickSize(-wdt).tickFormat(''));
	cmb.append('g')
		.attr('class','xAxis')
		.attr('transform','translate(0,'+(hgt/2)+')')
		.call(d3.axisBottom(x).tickSizeOuter(0))
		.selectAll('.tick text')
		.call(wrap,x.bandwidth());
	cmb.append('g')
		.call(d3.axisLeft(y).tickArguments([20,'+p']));
	cmb.append('text')
		.attr('class','title')
		.attr('x',30)
		.attr('y',40)
		.text('Percentage of people earning above/below $50K, by education level and race');
	cmb.append('text')
		.attr('class','note')
		.attr('x',wdt+4)
		.attr('y',(hgt/2)-20)
		.attr('dy','1em')
		.text('👤 ⬆ $50K');
	cmb.append('text')
		.attr('class','note')
		.attr('x',wdt+4)
		.attr('y',(hgt/2)+20)
		.text('👤 ⬇ $50K');

	var legend = cmb.selectAll()
		.data(ethDom)
		.enter()
		.append('g')
		.attr('class','legend')
		.attr('transform',function(d,i){
			return 'translate(0,'+(i*20)+')';
		});
	legend.append('rect')
		.attr('x',30)
		.attr('y',60)
		.attr('width',18)
		.attr('height',18)
		.style('fill',ethCol);
	legend.append('text')
		.attr('x',54)
		.attr('y',70)
		.attr('dy','0.3em')
		.text(function(d){
			return d;
		});
});