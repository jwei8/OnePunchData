class Barchart {

    constructor(_config, _data, _genreToInfo) {
        this.config = {
            parentElement: _config.parentElement,
            parentTitleElement: _config.parentTitleElement,
            containerWidth: 1700,
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
        this.data = _data;
        this.genreToInfo = _genreToInfo;
        this.svgTitle = d3.select(this.config.parentTitleElement);
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

        // Create the color scale
        vis.colorScale = d3.scaleOrdinal()
            .domain(vis.genres)
            .range(vis.genres.map(genre => vis.genreToInfo[genre].color));

        vis.xAxis = d3.axisBottom(vis.xScale)
            .tickSizeOuter(0);

        vis.yAxis = d3.axisLeft(vis.yScale)
            .tickFormat(d3.format('d')); // Display years as integers

        // Define size of SVG drawing area
        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        vis.chart = vis.svg.append('g')
            .attr('class', "bars")
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        vis.xAxisG = vis.chart.append('g')
            .attr('class', 'axis x-axis barAxis')
            .attr('transform', `translate(0,${vis.height})`);

        // Append y-axis group 
        vis.yAxisG = vis.chart.append('g')
            .attr('class', 'axis y-axis barAxis');

        // Append x-axis title
        vis.svg.append('text')
            .attr('class', 'axis-title')
            .attr('x', vis.config.containerWidth / 2)
            .attr('y', vis.config.containerHeight - 5) // Adjust the position as needed
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

        // Append x-axis group
        vis.xAxisG = vis.chart.append('g')
            .attr('class', 'axis x-axis barAxis')
            .attr('transform', `translate(0,${vis.height})`);

        // Append x-axis line
        vis.xAxisG.append("line")
            .attr("class", "axis-line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", vis.width)
            .attr("y2", 0)
            .style("stroke", "black")
            .style("stroke-width", 2);

        // Append x-axis ticks
        vis.xAxisG.selectAll(".tick line")
            .attr("class", "axis-tick")
            .style("stroke", "black");

        // Append y-axis group
        vis.yAxisG = vis.chart.append('g')
            .attr('class', 'axis y-axis barAxis');

        // Append y-axis line
        vis.yAxisG.append("line")
            .attr("class", "axis-line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", 0)
            .attr("y2", vis.height)
            .style("stroke", "black")
            .style("stroke-width", 2);

        // Append y-axis ticks
        vis.yAxisG.selectAll(".tick line")
            .attr("class", "axis-tick")
            .style("stroke", "black");


        // tooltip
        vis.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        // Initialize stack generator and specify the categories or layers
        // that we want to show in the chart
        vis.stack = d3.stack()
            .keys(vis.genres);

        vis.renderTitle();
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

        // array of years
        vis.years = vis.flattenedData.map(d => d.Year);

        // add the options to the button
        d3.selectAll("#selectButtonFrom, #selectButtonTo")
            .selectAll('myOptions')
            .data(vis.years)
            .enter()
            .append('option')
            .text(function (d) { return d; }) // text showed in the menu
            .attr("value", function (d) { return d; }) // corresponding value returned by the button


        // set default value to 2021
        d3.select('#selectButtonTo').property('value', '2021');

        vis.from = d3.select("#selectButtonFrom").property("value");
        vis.to = d3.select("#selectButtonTo").property("value");

        d3.select("#selectButtonFrom").on("change", function (d) {
            vis.from = this.value;
            vis.updateYearRange(vis.from, vis.to);
        })

        d3.select("#selectButtonTo").on("change", function (d) {
            vis.to = this.value;
            vis.updateYearRange(vis.from, vis.to);
        })

        const start = 1990;
        console.log(start);
        const finish = 2010;
        const yearRange = Array.from({ length: finish - start + 1 }, (_, a) => a + start);
        console.log(yearRange);

        // Set the scale input domains
        // vis.xScale.domain(vis.years);
        vis.xScale.domain(vis.years);
        vis.yScale.domain([0, d3.max(vis.flattenedData, d => d.Action + d['Sci-Fi'] + d.Drama + d['Slice of Life'] + d.Mystery + d.Comedy + d.Adventure + d.Game + d.Music + d.Harem)]);
        vis.x1.domain(vis.genres).rangeRound([0, vis.xScale.bandwidth()]);

        // Extract keys for values (assuming 'Action', 'Drama', etc as keys)
        vis.valueKeys = Object.keys(vis.flattenedData[0]).filter(key => key !== 'Year');

        // Call stack generator on the dataset
        vis.stackedData = vis.stack(vis.flattenedData);

        vis.renderVis();
    }

    updateYearRange(from, to) {
        let vis = this;

        d3.selectAll("#bar-chart > .bars > g > rect").remove();
        console.log(from);
        console.log(to);
        let start = parseInt(from);
        let finish = parseInt(to);
        let yearRange = Array.from({ length: finish - start + 1 }, (_, a) => a + start);
        console.log(yearRange);

        // Set the scale input domains
        // vis.xScale.domain(vis.years);
        vis.xScale.domain(yearRange);
        vis.yScale.domain([0, d3.max(vis.flattenedData, d => d.Action + d['Sci-Fi'] + d.Drama + d['Slice of Life'] + d.Mystery + d.Comedy + d.Adventure + d.Game + d.Music + d.Harem)]);
        vis.x1.domain(vis.genres).rangeRound([0, vis.xScale.bandwidth()]);

        vis.filteredByYearData = vis.flattenedData.filter((data) => data.Year >= vis.from && data.Year <= vis.to);
        vis.stackedData = vis.stack(vis.filteredByYearData);

        console.log(vis.filteredByYearData);
        console.log(vis.stackedData);

        // vis.renderVis();
        if (vis.selectedGenre === undefined || vis.selectedGenre === null) {
            d3.selectAll("#bar-chart > .bars > g > rect").remove();
            vis.stack = d3.stack()
                .keys(vis.genres);
            // vis.updateVis();
            vis.renderStackedBar();
            // Update axes
            const t = d3.transition().duration(500);
            vis.xAxisG.transition(t).call(vis.xAxis).call((g) => g.select(".domain").remove());
            vis.yAxisG.transition(t).call(vis.yAxis).call((g) => g.select(".domain").remove());

        } else {
            d3.selectAll("#bar-chart > .bars > g > rect").remove();
            vis.stack = d3.stack()
                .keys([vis.selectedGenre]);
            vis.isStacked = true;
            vis.transitionOneGenre(vis.selectedGenre);

            // Update axes
            const t = d3.transition().duration(500);
            vis.xAxisG.transition(t).call(vis.xAxis).call((g) => g.select(".domain").remove());
            vis.yAxisG.transition(t).call(vis.yAxis).call((g) => g.select(".domain").remove());
        }
    }

    renderStackedBar() {
        let vis = this;
        vis.isStacked = true;

        // vis.xScale.domain(yearRange);
        // vis.yScale.domain([0, d3.max(vis.flattenedData, d => d.Action + d['Sci-Fi'] + d.Drama + d['Slice of Life'] + d.Mystery + d.Comedy + d.Adventure + d.Game + d.Music + d.Harem)]);
        // vis.x1.domain(vis.genres).rangeRound([0, vis.xScale.bandwidth()]);

        vis.filteredByYearData = vis.flattenedData.filter((data) => data.Year >= vis.from && data.Year <= vis.to);
        vis.stackedData = vis.stack(vis.filteredByYearData);

        vis.bars = vis.chart.selectAll(".category")
            .data(vis.stackedData)
            .join("g")
            .attr("fill", function (d) { return vis.genreToInfo[d.key].color })
            .selectAll("rect")
            .data(d => d)
            .join("rect")
            // .attr('x', d => `${vis.xScale(d.data.Year) + 54}`)
            .attr('x', d => `${vis.xScale(d.data.Year)}`)
            .attr('y', d => vis.yScale(d[1]))
            .attr('width', vis.xScale.bandwidth())
            // .attr('width', "30px")
            .attr('height', d => vis.yScale(d[0]) - vis.yScale(d[1]))
            .style('fill-opacity', .9)
            .on('mouseover', (event, d) => {
                vis.tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                vis.tooltip.html(`
                    <h3>${d.data.Year}</h3>
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
                    .style("left", ((event.pageX)) + "px")
                    .style("top", (event.pageY - 100 + "px"))
            })
            .on('mouseout', () => {
                vis.tooltip.transition()
                    .duration(500)
                    .style("opacity", "0");
            })
    }

    renderGroupedBar() {
        let vis = this;
        vis.isStacked = false;

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

    renderVis() {
        let vis = this;

        vis.isStacked = true;

        vis.renderStackedBar();

        // Update axes
        const t = d3.transition().duration(500);
        vis.xAxisG.transition(t).call(vis.xAxis).call((g) => g.select(".domain").remove());
        vis.yAxisG.transition(t).call(vis.yAxis).call((g) => g.select(".domain").remove());

        d3.selectAll("input").on("change", change);

        function change() {
            if (this.value === "grouped") {
                vis.selectedGenre = null;

                vis.updateFiltered();

                vis.transitionGrouped();
            }
            if (this.value === "stacked") {
                vis.selectedGenre = null;

                vis.updateFiltered();
                vis.stack = d3.stack()
                    .keys(vis.genres);
                vis.stackedData = vis.stack(vis.flattenedData);
                vis.transitionStacked();
            }
        }
    }

    renderTitle() {
        let vis = this;

        vis.legendTitleGroup = vis.svgTitle.append('g')
            .attr('class', 'title')
            .attr('transform', `translate(${0},${0})`);

        // Append the first text element
        let titleText = vis.legendTitleGroup.append('text')
            .attr('class', 'title-topView-text')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .text("Number of Animes by Genre Per Year");

        // Calculate the maximum width of both text elements
        let titleWidth = titleText.node().getBBox().width;
        let titleHeight = titleText.node().getBBox().height;

        // set svg height
        vis.svgTitle.attr('width', titleWidth)
            .attr('height', titleHeight);

        vis.legendTitleGroup
            .attr('transform', `translate(${titleWidth / 2}, ${titleHeight / 2})`);
    }

    transitionGrouped() {
        let vis = this;
        vis.isStacked = false;

        vis.yScale.domain([0, d3.max(vis.flattenedData, d => d3.max(vis.genres, key => d[key]))]) // in each key, look for the maximum number
        const t = d3.transition().duration(500);
        vis.yAxisG.transition(t).call(vis.yAxis);

        vis.chart.selectAll("rect").remove();

        vis.renderGroupedBar();
    }

    transitionStacked() {
        let vis = this;
        vis.isStacked = true;

        vis.yScale.domain([0, d3.max(vis.flattenedData, d => d.Action + d['Sci-Fi'] + d.Drama + d['Slice of Life'] + d.Mystery + d.Comedy + d.Adventure + d.Game + d.Music + d.Harem)]);
        const t = d3.transition().duration(500);
        vis.yAxisG.transition(t).call(vis.yAxis);

        vis.chart.selectAll("rect").remove();

        vis.renderStackedBar();
    }

    transitionOneGenre(currGenre) {
        let vis = this;

        d3.selectAll("#bar-chart > .bars > g > rect").remove();

        vis.filteredByYearData = vis.flattenedData.filter((data) => data.Year >= vis.from && data.Year <= vis.to);
        vis.stackedData = vis.stack(vis.filteredByYearData);

        vis.yScale.domain([0, d3.max(vis.filteredByYearData, d => d3.max(vis.genres, key => d[key]))]) // in each key, look for the maximum number

        const t = d3.transition().duration(500);
        vis.yAxisG.transition(t).call(vis.yAxis);

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
    }

    updateFiltered() {
        let vis = this;

        if (vis.isStacked) {
            if (vis.selectedGenre === undefined || vis.selectedGenre === null) {
                d3.selectAll("#bar-chart > .bars > g > rect").remove();
                vis.stack = d3.stack()
                    .keys(vis.genres);
                // vis.updateVis();
                vis.xScale.domain(vis.years);
                vis.yScale.domain([0, d3.max(vis.flattenedData, d => d.Action + d['Sci-Fi'] + d.Drama + d['Slice of Life'] + d.Mystery + d.Comedy + d.Adventure + d.Game + d.Music + d.Harem)]);
                vis.x1.domain(vis.genres).rangeRound([0, vis.xScale.bandwidth()]);

                // Extract keys for values (assuming 'Action', 'Drama', etc as keys)
                vis.valueKeys = Object.keys(vis.flattenedData[0]).filter(key => key !== 'Year');

                // Call stack generator on the dataset
                vis.stackedData = vis.stack(vis.flattenedData);

                // vis.renderVis();
                vis.updateYearRange(vis.from, vis.to);

            } else {
                d3.selectAll("#bar-chart > .bars > g > rect").remove();
                vis.stack = d3.stack()
                    .keys([vis.selectedGenre]);
                vis.isStacked = true;
                vis.transitionOneGenre(vis.selectedGenre);
            }

        } else {
            if (vis.selectedGenre === undefined || vis.selectedGenre === null) {
                vis.transitionGrouped();
            } else {
                d3.selectAll("#bar-chart > .bars > g > rect").remove();
                vis.stack = d3.stack()
                    .keys([vis.selectedGenre]);
                vis.transitionOneGenre(vis.selectedGenre);
            }
        }
    }

    updateChart(selectedGenre) {
        let vis = this;
        vis.selectedGenre = selectedGenre;
        vis.updateFiltered();
    }
}