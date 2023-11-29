class Barchart {

    constructor(_config, _data, _genreToInfo) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: 1400,
            containerHeight: 300,
            margin: {
                top: 40,
                right: 40,
                bottom: 40,
                left: 60
            },
            // Todo: Add or remove attributes from config as needed
            tooltipPadding: 10, // Added a tooltip padding configuration
        }
        //   this.dispatcher = _dispatcher;
        this.data = _data;
        this.genreToInfo = _genreToInfo;
        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
        vis.genres = ['Action', 'Sci-Fi', 'Drama', 'Slice of Life', 'Mystery', 'Comedy', 'Adventure', 'Game', 'Music', 'Harem'];

        vis.xScale = d3.scaleBand()
            .range([0, vis.width])
            .padding(0.1)
            .paddingInner(0.2);

        vis.x1 = d3.scaleBand()
            .padding(0.05);

        vis.yScale = d3.scaleLinear()
            .range([vis.height, 0]);

        vis.color = d3.scaleOrdinal()
            .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);
        // Create the color scale
        vis.colorScale = d3.scaleOrdinal()
            .domain(vis.genres)
            .range(vis.genres.map(genre => vis.genreToInfo[genre].color));

        vis.xAxis = d3.axisBottom(vis.xScale)
            // .ticks(6)
            .tickSizeOuter(0);

        vis.yAxis = d3.axisLeft(vis.yScale)
            // .ticks(6)
            // .tickSize(-vis.width)
            // .tickSizeOuter(0)
            .tickFormat(d3.format('d')); // Display years as integers

        // Define size of SVG drawing area
        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        vis.chart = vis.svg.append('g')
            .attr('class', "bars")
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        vis.xAxisG = vis.chart.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${vis.height})`);

        // Append y-axis group 
        vis.yAxisG = vis.chart.append('g')
            .attr('class', 'axis y-axis');

        // Append axis title
        vis.svg.append('text')
            .attr('class', 'axis-title')
            .attr('x', 40)
            .attr('y', 20)
            .text('Number of Animes By Genre Per Year');

        // Append x-axis title
        vis.svg.append('text')
            .attr('class', 'axis-title')
            .attr('x', vis.config.containerWidth / 2)
            .attr('y', vis.config.containerHeight) // Adjust the position as needed
            .style('text-anchor', 'middle')
            .text('Year');

        // Append y-axis title
        vis.svg.append('text')
            .attr('class', 'axis-title')
            .attr('transform', 'rotate(-90)')
            .attr('x', -vis.config.containerHeight / 2)
            .attr('y', 30) // Adjust the position as needed
            .style('text-anchor', 'middle')
            .text('Count');

        // tooltip
        vis.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        // Initialize stack generator and specify the categories or layers
        // that we want to show in the chart
        vis.stack = d3.stack()
            .keys(['Action', 'Sci-Fi', 'Drama', 'Slice of Life', 'Mystery', 'Comedy', 'Adventure', 'Game', 'Music', 'Harem']);
    }


    updateVis() {
        let vis = this;

        // Group the data by genre and year and calculate the count for each group
        var nestedData = d3.group(data, d => d.YearReleased, d => d.Genre);

        // Flatten the nested data structure
        vis.flattenedData = [];

        nestedData.forEach(function (year, yearKey) {
            let groupedByYearObj = {};
            groupedByYearObj['Year'] = yearKey;

            // initial each genre to have count 0
            let genres = vis.genres;
            genres.forEach(genre => {
                groupedByYearObj[genre] = 0;
            })

            year.forEach(function (genre, genreKey) {
                groupedByYearObj[genreKey] = genre.length;
            });
            vis.flattenedData.push(groupedByYearObj);
        });

        // Sort the array by year
        vis.flattenedData.sort(function (a, b) {
            return a.Year - b.Year;
        });

        // console.log(vis.flattenedData);

        // Set the scale input domains
        vis.xScale.domain(vis.flattenedData.map(d => d.Year));
        vis.yScale.domain([0, d3.max(vis.flattenedData, d => d.Action + d['Sci-Fi'] + d.Drama + d['Slice of Life'] + d.Mystery + d.Comedy + d.Adventure + d.Game + d.Music + d.Harem)]);
        // vis.yScale.domain([0, d3.max(vis.flattenedData, d => d3.max(vis.genres, key => d[key]))]) // in each key, look for the maximum number
        vis.x1.domain(vis.genres).rangeRound([0, vis.xScale.bandwidth()]);

        // Extract keys for values (assuming 'Action', 'Drama', etc as keys)
        vis.valueKeys = Object.keys(vis.flattenedData[0]).filter(key => key !== 'Year');

        // Call stack generator on the dataset
        vis.stackedData = vis.stack(vis.flattenedData);

        vis.renderVis();
    }

    renderVis() {
        let vis = this;

        vis.isStacked = true;

        vis.bars = vis.chart.selectAll(".category")
            .data(vis.stackedData)
            .join("g")
            .attr("fill", function (d) { return vis.genreToInfo[d.key].color })
            .selectAll("rect")
            .data(d => d)
            .join("rect")
            .attr('x', d => vis.xScale(d.data.Year))
            .attr('y', d => vis.yScale(d[1]))
            .attr('width', vis.xScale.bandwidth())
            .attr('height', d => vis.yScale(d[0]) - vis.yScale(d[1]))
            .on('mouseover', (event, d) => {
                vis.tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                vis.tooltip.html(`
                    <div class="tooltip-title">${d.data.Year}</div>
                    <ul>
                        <li>Harem: ${d.data.Harem}</li>
                        <li>Music: ${d.data.Music}</li>
                        <li>Game: ${d.data.Game}</li>
                        <li>Adventure: ${d.data.Adventure}</li>
                        <li>Comedy: ${d.data.Comedy}</li>
                        <li>Mystery: ${d.data.Mystery}</li>
                        <li>Slice of Life: ${d.data["Slice of Life"]}</li>
                        <li>Drama: ${d.data.Drama}</li>
                        <li>Sci-Fi: ${d.data["Sci-Fi"]}</li>
                        <li>Action: ${d.data.Action}</li>
                    </ul>
                `)
                    .style("left", (event.pageX) + "px")
                    .style("top", (event.pageY - 100) + "px");


            })
            .on('mousemove', function (event, d) {
                vis.tooltip
                    .style("left", ((event.pageX)) + "px") // It is important to put the +90: other wise the tooltip is exactly where the point is an it creates a weird effect
                    .style("top", (event.pageY - 100 + "px"))
            })
            .on('mouseout', () => {
                vis.tooltip.transition()
                    .duration(500)
                    .style("opacity", "0");
            })

        // Update axes
        const t = d3.transition().duration(500);
        // vis.yAxisG.transition(t).call(vis.yAxis);
        vis.xAxisG.transition(t).call(vis.xAxis).call((g) => g.select(".domain").remove());
        vis.yAxisG.transition(t).call(vis.yAxis).call((g) => g.select(".domain").remove());

        // d3.selectAll("input").on("change", vis.change);
        d3.selectAll("input").on("change", change);

        function change() {
            if (this.value === "grouped") {
                // vis.updateLegendColors(); 
                vis.selectedGenre = null;
                vis.updateLegendColors();
                vis.updateFiltered();

                vis.transitionGrouped();
            }
            if (this.value === "stacked") {
                vis.selectedGenre = null;
                vis.updateLegendColors();
                vis.updateFiltered();
                vis.stack = d3.stack()
                    .keys(['Action', 'Sci-Fi', 'Drama', 'Slice of Life', 'Mystery', 'Comedy', 'Adventure', 'Game', 'Music', 'Harem']);
                vis.stackedData = vis.stack(vis.flattenedData);
                vis.transitionStacked();
            }
        }

        vis.renderLegend();
    }

    renderLegend() {
        let vis = this;

        if (vis.svg.select('.legend').empty()) {
            vis.legend = vis.svg.append('g')
                .attr('class', 'legend')
                .attr('transform', `translate(${70},${36})`);
        }

        // Add legend entries
        const genres = vis.colorScale.domain();
        const legendEntry = vis.legend.selectAll('.legend-entry')
            .data(genres)
            .join('g')
            .attr('class', 'legend-entry')
            .attr('transform', (d, i) => `translate(0, ${i * 20})`)
            .style('cursor', 'pointer')
            .on('click', (event, selectedGenre) => {
                if (vis.selectedGenre === selectedGenre) {
                    vis.selectedGenre = null; // Deselect if the same genre is clicked again
                } else {
                    vis.selectedGenre = selectedGenre; // Select the new genre
                }
                vis.updateLegendColors();
                vis.updateFiltered();
            });

        // Add the colored rectangles
        legendEntry.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 12)
            .attr('height', 12)
            .attr('fill', d => vis.colorScale(d));

        // Add the text labels
        legendEntry.append('text')
            .attr('x', 20)
            .attr('y', 12)
            .text(d => d);

        // Initial rendering with no genre filtered
        // vis.updateFiltered();
    }


    transitionGrouped() {
        let vis = this;

        vis.isStacked = false;
        // vis.yAxisG.call(vis.yAxis).call((g) => g.select(".domain").remove());
        vis.yScale.domain([0, d3.max(vis.flattenedData, d => d3.max(vis.genres, key => d[key]))]) // in each key, look for the maximum number
        const t = d3.transition().duration(500);
        vis.yAxisG.transition(t).call(vis.yAxis);

        vis.chart.selectAll("rect").remove();
        // vis.selectedGenre === null;

        vis.bars = vis.chart.selectAll(".category")
            .remove()
            .data(vis.flattenedData)
            .join("g")
            .attr("transform", function (d) { return "translate(" + vis.xScale(d.Year) + ",0)"; }) // place each bar along the x-axis at the place defined by the xScale variable
            .selectAll("rect")
            .data(d => vis.valueKeys.map(key => ({ key, value: d[key] }))) // use the keys to access the data separately
            .join("rect")
            .attr("x", function (d) { return vis.x1(d.key); }) // use the x1 variable to place the grouped bars
            .attr("y", function (d) { return vis.yScale(d.value); }) // draw the height of the barse using the data from the keys as the height value
            .attr("width", vis.x1.bandwidth()) // bar is the width defined by the x1 variable
            .attr("height", d => vis.yScale(0) - vis.yScale(d.value))
            .attr("fill", function (d) { return vis.genreToInfo[d.key].color; })
            .on('mouseover', (event, d) => {
                vis.tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                vis.tooltip.html(`
                    <div class="tooltip-title">${d.key}: ${d.value}</div>
                `)
                    .style("left", (event.pageX) + "px")
                    .style("top", (event.pageY) + "px");
            })
            .on('mousemove', function (event, d) {
                vis.tooltip
                    .style("left", ((event.pageX)) + "px")
                    .style("top", (event.pageY + "px"))
            })
            .on('mouseout', () => {
                vis.tooltip.transition()
                    .duration(500)
                    .style("opacity", "0");
            })

    }

    transitionStacked() {
        let vis = this;

        vis.isStacked = true;

        vis.yScale.domain([0, d3.max(vis.flattenedData, d => d.Action + d['Sci-Fi'] + d.Drama + d['Slice of Life'] + d.Mystery + d.Comedy + d.Adventure + d.Game + d.Music + d.Harem)]);

        const t = d3.transition().duration(500);
        vis.yAxisG.transition(t).call(vis.yAxis);

        vis.chart.selectAll("rect").remove();


        vis.bars = vis.chart.selectAll(".category")
            .data(vis.stackedData)
            .join("g")
            .attr("fill", function (d) { return vis.genreToInfo[d.key].color })
            .selectAll("rect")
            .data(d => d)
            .join("rect")
            .attr('x', d => vis.xScale(d.data.Year))
            .attr('y', d => vis.yScale(d[1]))
            .attr('width', vis.xScale.bandwidth())
            .attr('height', d => vis.yScale(d[0]) - vis.yScale(d[1]))
            .on('mouseover', (event, d) => {
                vis.tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                vis.tooltip.html(`
                    <div class="tooltip-title">${d.data.Year}</div>
                    <ul>
                        <li>Harem: ${d.data.Harem}</li>
                        <li>Music: ${d.data.Music}</li>
                        <li>Game: ${d.data.Game}</li>
                        <li>Adventure: ${d.data.Adventure}</li>
                        <li>Comedy: ${d.data.Comedy}</li>
                        <li>Mystery: ${d.data.Mystery}</li>
                        <li>Slice of Life: ${d.data["Slice of Life"]}</li>
                        <li>Drama: ${d.data.Drama}</li>
                        <li>Sci-Fi: ${d.data["Sci-Fi"]}</li>
                        <li>Action: ${d.data.Action}</li>
                    </ul>
                `)
                    .style("left", (event.pageX) + "px")
                    .style("top", (event.pageY - 100) + "px");


            })
            .on('mousemove', function (event, d) {
                vis.tooltip
                    .style("left", ((event.pageX)) + "px") // It is important to put the +90: other wise the tooltip is exactly where the point is an it creates a weird effect
                    .style("top", (event.pageY - 100 + "px"))
            })
            .on('mouseout', () => {
                vis.tooltip.transition()
                    .duration(500)
                    .style("opacity", "0");
            })



        // vis.bars.transition()
        //     .duration(500)
        //     .delay((d, i) => i * 20)
        //     .attr('y', d => vis.yScale(d[1]))
        //     .attr('height', d => vis.yScale(d[0]) - vis.yScale(d[1]))
        //     .transition()
        //     .attr('x', d => vis.xScale(d.data.Year))
        //     .attr('width', vis.xScale.bandwidth());

    }

    transitionOneGenre(currGenre) {
        let vis = this;

        d3.selectAll("#bar-chart > .bars > g > rect").remove();

        vis.stackedData = vis.stack(vis.flattenedData);

        vis.yScale.domain([0, d3.max(vis.flattenedData, d => d3.max(vis.genres, key => d[key]))]) // in each key, look for the maximum number

        const t = d3.transition().duration(500);
        vis.yAxisG.transition(t).call(vis.yAxis);

        // vis.chart.selectAll("rect").remove();

        vis.bars = vis.chart.selectAll(".category")
            .data(vis.stackedData)
            .join("g")
            .attr("fill", function (d) { return vis.genreToInfo[d.key].color })
            .selectAll("rect")
            .data(d => d)
            .join("rect")
            .attr('x', d => vis.xScale(d.data.Year))
            .attr('y', d => vis.yScale(d[1]))
            .attr('width', vis.xScale.bandwidth())
            .attr('height', d => vis.yScale(d[0]) - vis.yScale(d[1]))
            .on('mouseover', (event, d) => {
                vis.tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                vis.tooltip.html(`
                    <div class="tooltip-title">${d.data.Year}</div>
                    <ul>
                        <li>${currGenre}: ${d.data[currGenre]}</li>
                    </ul>
                `)
                    .style("left", (event.pageX) + "px")
                    .style("top", (event.pageY - 100) + "px");


            })
            .on('mousemove', function (event, d) {
                vis.tooltip
                    .style("left", ((event.pageX)) + "px") // It is important to put the +90: other wise the tooltip is exactly where the point is an it creates a weird effect
                    .style("top", (event.pageY - 100 + "px"))
            })
            .on('mouseout', () => {
                vis.tooltip.transition()
                    .duration(500)
                    .style("opacity", "0");
            })



        // vis.bars.transition()
        //     .duration(500)
        //     .delay((d, i) => i * 20)
        //     .attr('y', d => vis.yScale(d[1]))
        //     .attr('height', d => vis.yScale(d[0]) - vis.yScale(d[1]))
        //     .transition()
        //     .attr('x', d => vis.xScale(d.data.Year))
        //     .attr('width', vis.xScale.bandwidth());

    }

    updateLegendColors() {
        let vis = this;

        vis.legend.selectAll('.legend-entry rect')
            .attr('fill', d => vis.selectedGenre === null || vis.selectedGenre === d ? vis.colorScale(d) : '#d3d3d3')
            .attr('fill-opacity', d => vis.selectedGenre === null || vis.selectedGenre === d ? 1 : 0.3); // Lower opacity for greyed-out legend boxes
    }

    updateFiltered() {
        let vis = this;
        // d3.selectAll("g > *").remove();

        // d3.selectAll("#bar-chart > g > g > rect").remove();
        // vis.stack = d3.stack()
        //     .keys(['Action']);

        // vis.updateVis();
        if (vis.isStacked) {
            console.log('stacked');
            if (vis.selectedGenre === undefined || vis.selectedGenre === null) {
                d3.selectAll("#bar-chart > .bars > g > rect").remove();
                vis.stack = d3.stack()
                    .keys(['Action', 'Sci-Fi', 'Drama', 'Slice of Life', 'Mystery', 'Comedy', 'Adventure', 'Game', 'Music', 'Harem']);

                vis.updateVis();

            } else {
                d3.selectAll("#bar-chart > .bars > g > rect").remove();
                vis.stack = d3.stack()
                    .keys([vis.selectedGenre]);

                // vis.updateVis();
                vis.isStacked = true;
                vis.transitionOneGenre();
            }

        } else {
            console.log('grouped');

            // vis.selectedGenre === null;

            // d3.selectAll("#bar-chart > g > g > rect").remove();
            // console.log("grouped");
            console.log(vis.selectedGenre);
            if (vis.selectedGenre === undefined || vis.selectedGenre === null) {
                vis.transitionGrouped();
                console.log("unselected");

            } else {
                console.log('ello');
                d3.selectAll("#bar-chart > .bars > g > rect").remove();
                vis.stack = d3.stack()
                    .keys([vis.selectedGenre]);

                // vis.updateVis();
                vis.transitionOneGenre(vis.selectedGenre);
            }
        }

        vis.updateLegendColors();
    }

    updateChart(selectedGenre) {
        let vis = this;
        vis.selectedGenre = selectedGenre;
        vis.updateFiltered();
    }



}