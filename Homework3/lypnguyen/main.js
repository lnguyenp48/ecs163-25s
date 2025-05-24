// boundary and margin setup
const width = window.innerWidth;
const height = window.innerHeight;

let scatterLeft = 0, scatterTop = 0;
let scatterMargin = {top: 20, right: 30, bottom: 30, left: 80},
    scatterWidth = width*0.25 - scatterMargin.left - scatterMargin.right,
    scatterHeight = height*0.6 - scatterMargin.top - scatterMargin.bottom;

let distrLeft = width*0.2, distrTop = height*0.1;
let distrMargin = {top: 60, right: 30, bottom: 30, left: 60},
    distrWidth = width*0.9 - distrMargin.left - distrMargin.right,
    distrHeight = height*0.9 - distrMargin.top - distrMargin.bottom;

let barLeft = 0, barTop = height - height*0.35;
let barMargin = {top: 10, right: 30, bottom: 30, left: 80},
    barWidth = width*0.25 - barMargin.left - barMargin.right,
    barHeight = height*0.3 - barMargin.top - barMargin.bottom;


// colors for each type of pokemon stat
let stat_colors = {
    HP: "limegreen", 
    Attack: "gold",
    Defense: "coral",
    Sp_Atk: "mediumturquoise",
    Sp_Def: "darkslateblue",
    Speed: "fuchsia"
};

// names of just the individual stats
let justStats = ["HP", "Attack", "Defense", "Sp_Atk", "Sp_Def", "Speed"];


/*
 * PLOTS
 */

// grabbing all data required for these plots
d3.csv("pokemon_alopez247.csv").then(rawData =>{
    console.log("rawData", rawData);

    rawData.forEach(function(d){
        d.Total = Number(d.Total);
        d.HP = Number(d.HP);
        d.Attack = Number(d.Attack);
        d.Defense = Number(d.Defense);
        d.Sp_Atk = Number(d.Sp_Atk);
        d.Sp_Def = Number(d.Sp_Def);
        d.Speed = Number(d.Speed);
        d.Catch_Rate = Number(d.Catch_Rate);
    });

    // filtering out which stat is the highest and saving it together with all other stats
    const numProcessData = rawData.map(d=>{
                          const highest = Object.keys(d)
                                    .filter(key => justStats.includes(key)) // filters into just the relevant stat keys
                                    .reduce((a, b) => d[a] > d[b] ? a : b); // reduces into the maximum value and returns the Key of it
                          return {
                              "Totals": d.Total,
                              "HP": d.HP,
                              "Attack": d.Attack,
                              "Defense": d.Defense,
                              "Sp_Atk": d.Sp_Atk,
                              "Sp_Def": d.Sp_Def,
                              "Speed": d.Speed,
                              "Catch_Rate": d.Catch_Rate,
                              "HighestStat": highest, 
                              "HighestStat_Color": stat_colors[highest] // returns the color associated with the highest stat
                          };
    });
    console.log("numProcessData", numProcessData);

    // grouping pokemon by their highest stat and then getting the average catch rate
    const stats = {};
    numProcessData.forEach(d => {
        if (d.HighestStat in stats) { // if stat is already there, add on to cumulative
            stats[d.HighestStat].count += 1;
            stats[d.HighestStat].cumulativeCatchRate += d.Catch_Rate;
        }
        else { // otherwise make a new listing
            const stat = {
                stat_name: d.HighestStat,
                count: 1,
                cumulativeCatchRate: d.Catch_Rate,
                averageCatchRate: 0,
                stat_color: d.HighestStat_Color
            }
            stats[d.HighestStat] = stat;
        }
    })

    // create final array for average objects 
    const avgCatchStats = [];
    Object.keys(stats).forEach(d => {
        stats[d].averageCatchRate = stats[d].cumulativeCatchRate / stats[d].count; // calculate average
        avgCatchStats.push(stats[d]);
    })
    console.log("Average Catch Stats", avgCatchStats);

    // Create SVG
    const svg = d3.select("svg");

    // Page Title
    const g0 = svg.append("g")
                .attr("width", width) 
                .attr("height", 100)

    g0.append("text")
    .attr("x", width / 2) 
    .attr("y", 30)
    .attr("font-size", "30px")
    .attr("text-anchor", "middle")
    .text("Do Pokemon Catch Rates Correlate with their Overall Stats?")
    
    // PLOT 1: Scatter Plot for total stat to catch rate
    // adjusted provided template to fit needs

    // Create sub svg
    const g1 = svg.append("g")
                .attr("width", scatterWidth + scatterMargin.left + scatterMargin.right)
                .attr("height", scatterHeight + scatterMargin.top + scatterMargin.bottom)
                .attr("transform", `translate(${scatterMargin.left}, ${scatterMargin.top})`);

    // X axis label
    g1.append("text")
    .attr("x", scatterWidth / 2)
    .attr("y", scatterHeight + 50)
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .text("Pokemon Catch Rates");


    // Y label
    g1.append("text")
    .attr("x", -(scatterHeight / 2))
    .attr("y", -40)
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text("Pokemon Stats (Added for Totals)");

    // X ticks
    const x1 = d3.scaleLinear()
    .domain([0, Math.ceil(d3.max(numProcessData, d => d.Catch_Rate)/10)*10])
    .range([0, scatterWidth]);

    const xAxisCall = d3.axisBottom(x1)
                        .ticks(10);
    g1.append("g")
    .attr("transform", `translate(0, ${scatterHeight})`)
    .call(xAxisCall)
    .selectAll("text")
        .attr("y", "10")
        .attr("x", "-5")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-40)");

    // Y ticks
    const y1 = d3.scaleLinear()
    .domain([Math.floor(d3.min(numProcessData, d => d.Totals)/100)*100, Math.ceil(d3.max(numProcessData, d => d.Totals)/100)*100])
    .range([scatterHeight, 0]);

    const yAxisCall = d3.axisLeft(y1)
                        .ticks(10);
    g1.append("g").call(yAxisCall);

    // circles
    const circles = g1.selectAll("circle").data(numProcessData);

    circles.enter().append("circle")
         .attr("cx", d => x1(d.Catch_Rate))
         .attr("cy", d => y1(d.Totals))
         .attr("r", 3) // maybe make this dynamic?
         .attr("fill", d => d.HighestStat_Color) // each pokemon has its own highest stat color
         .attr("fill-opacity", 0.6);

    // PLOT 3, ADVANCED VIS: parallel coordinate plot for pokemon stat values
    // source: https://d3-graph-gallery.com/graph/parallel_basic.html 
    // source two: https://d3-graph-gallery.com/graph/parallel_custom.html 

    // create sub svg
    const g2 = svg.append("g")
                .attr("width", distrWidth + distrMargin.left + distrMargin.right)
                .attr("height", distrHeight + distrMargin.top + distrMargin.bottom)
                .attr("transform", `translate(${distrLeft}, ${distrTop})`);

    // grabbing just the axis names for each numerical stat
    const dimensions = d3.keys(numProcessData[0]).filter(function(d) {
        if (d == "HighestStat" || d == "HighestStat_Color") {
            return 0;
        } else return d;
    });
    console.log("dimensions", dimensions);

    // create y axis for each name of stat
    const axes = {};
    for (i in dimensions) {
        let name = dimensions[i];
        axes[name] = d3.scaleLinear()
            .domain(d3.extent(numProcessData, function(d) { return +d[name]; }))
            .range([distrHeight, 0])
    }

    // create x scale with position of y axis in mind
    const x2 = d3.scalePoint()
        .range([0, distrWidth])
        .padding(1)
        .domain(dimensions);

    // highlight stat that is hovered
    const highlight = function(d) {
        stat_select = d.HighestStat
        d3.selectAll(".line")
            .transition().duration(200)
            .style("stroke", "lightgrey")
            .style("stroke-width", 1)
            .style("opacity", 0.3)

        d3.selectAll("." + stat_select)
            .transition().duration(200)
            .style("stroke", d.HighestStat_Color)
            .style("stroke-width", 2)
            .style("opacity", 1)
    }
    
    // unhighlight on leave
    const unhighlight = function(d) {
        d3.selectAll(".line")
            .transition().duration(100).delay(250)
            .style("stroke", d => d.HighestStat_Color)
            .style("stroke-width", 1)
            .style("opacity", 0.5)
    } 

    // path function for the data's coordinates
    function path(d) {
        return d3.line()(dimensions.map(function(p) {return [x2(p), axes[p](d[p])]; }));
    }

    // drawing each line for data, use path to map
    const drawPath = g2.selectAll("myPath")
    .data(numProcessData)
    .enter().append("path")
    .attr("class", function(d) {return "line " + d.HighestStat})
    .attr("d", path)
    .style("fill", "none")
    .style("stroke", d => d.HighestStat_Color)
    .style("stroke-width", 1)
    .style("opacity", 0.5)
    .on("mouseover", highlight)
    .on("mouseleave", unhighlight);
    
    // brush settings
    const deselectColor = "#ddd";
    const brushWidth = 50;
    const brush = d3.brushY()
        .extent([
            [-(brushWidth / 2), 0],
            [brushWidth / 2, distrHeight]
        ])
        .on("start brush end", brushed);

    // drawing each axis for each stat category
    g2.selectAll("myAxis")
    .data(dimensions).enter()
    .append("g")
    .attr("transform", function(d) {return "translate(" + x2(d) + ")"; })
    .call(brush)
    .each(function(d) {d3.select(this).call(d3.axisLeft().scale(axes[d])); })
    .append("text")
        .style("text-anchor", "middle")
        .attr("y", -9)
        .text(function(d) { return d; })
        .style("fill", "black")
        .style("font-size", "20px")
        .style("font-family", "sans-serif");
    
    let selections = {};

    // picks out which lines have been selected by the brush. CURRENTLY BROKEN :(
    function brushed({selection}, key) {
        if (selection === null) selections.delete(key);
        else selections += axes[key];
        const selected = [];
        drawPath.enter().each(function(d) {
            const active = Array.from(selections).every(([key, [min, max]]) => d[key] >= min && d[key] <= max);
            d3.select(this).style("stroke", active ? d.HighestStat_Color : deselectColor);
            if (active) {
                d3.select(this).raise();
                selected.push(d);
            }
        });

        g2.property("value", selected).dispatch("input");
    }

    // PLOT 2: Bar Chart for average catch rate of the pokemon with specific highest stat
    // adjusted provided template to fit needs

    // create sub svg
    const g3 = svg.append("g")
                .attr("width", barWidth + barMargin.left + barMargin.right)
                .attr("height", barHeight + barMargin.top + barMargin.bottom)
                .attr("transform", `translate(${barMargin.left}, ${barTop})`);

    // X label
    g3.append("text")
    .attr("x", barWidth / 2)
    .attr("y", barHeight + 50)
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .text("Pokemon grouped by Highest Stat");


    // Y label
    g3.append("text")
    .attr("x", -(barHeight / 2))
    .attr("y", -40)
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text("Average Catch Rate");

    // X ticks
    const x3 = d3.scaleBand()
    .domain(avgCatchStats.map(d => d.stat_name))
    .range([0, barWidth])
    .paddingInner(0.3)
    .paddingOuter(0.2);

    const xAxisCall2 = d3.axisBottom(x3);
    g3.append("g")
    .attr("transform", `translate(0, ${barHeight})`)
    .call(xAxisCall2)
    .selectAll("text")
        .attr("y", "10")
        .attr("x", "-5")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-40)");

    // Y ticks
    const y3 = d3.scaleLinear()
    .domain([0, Math.ceil(d3.max(avgCatchStats, d => d.averageCatchRate)/10)*10])
    .range([barHeight, 0])
    .nice();

    const yAxisCall2 = d3.axisLeft(y3)
                        .ticks(6);
    g3.append("g").call(yAxisCall2);

    // bars
    const bars = g3.selectAll("rect").data(avgCatchStats);

    bars.enter().append("rect")
    .attr("y", d => y3(d.averageCatchRate))
    .attr("x", d => x3(d.stat_name))
    .attr("width", x3.bandwidth())
    .attr("height", d => barHeight - y3(d.averageCatchRate))
    .attr("fill", d => d.stat_color);

    // LEGEND: color key for each pokemon stat
    // source: https://d3-graph-gallery.com/graph/custom_legend.html
 
    // create sub svg
    const g4 = svg.append("g")
                .attr("width", distrWidth + distrMargin.left + distrMargin.right)
                .attr("height", distrHeight + distrMargin.top + distrMargin.bottom)
                .attr("transform", `translate(${distrLeft}, ${distrHeight})`)

    // map name to color on scale
    const color = d3.scaleOrdinal()
        .domain(justStats)
        .range(Object.values(stat_colors))

    // create each rectangle for each color
    let size = 20
    g4.selectAll("myLegend")
        .data(justStats)
        .enter()
        .append("rect")
            .attr("x", function(d, i) {return width*0.1 + i * (size+5) * width * 0.004 })
            .attr("y", 125)
            .attr("width", size)
            .attr("height", size/3)
            .style("fill", function(d) {return color(d)})

    // create each label for each rectangle
    g4.selectAll("myLabels")
        .data(justStats)
        .enter()
        .append("text")
            .attr("x", function(d, i) {return width*0.1 + i * (size+5) * width * 0.004 + 30 })
            .attr("y", 125)
            .style("fill", function(d) { return color(d) })
            .text(function(d) {return d})
            .attr("text-anchor", "left")
            .style("alignment-baseline", "middle")

    g4.append("text")
        .attr("x", width*0.3)
        .attr("y", 100)
        .attr("font-size", "20px")
        .attr("text-anchor", "middle")
        .text("Color indicates highest stat on each Pokemon.");
    
    }).catch(function(error){
    console.log(error);
});