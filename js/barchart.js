class Barchart {

    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: 1400,
            containerHeight: 300,
            margin: {
                top: 30,
                right: 5,
                bottom: 20,
                left: 30
            },
            // Todo: Add or remove attributes from config as needed
            tooltipPadding: 10, // Added a tooltip padding configuration
        }
        //   this.dispatcher = _dispatcher;
        this.data = _data;
        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
        vis.genres = ['Action', 'Sci-Fi', 'Drama', 'Slice of Life', 'Mystery', 'Comedy', 'Adventure', 'Game', 'Music', 'Harem'];
        vis.genreToInfo = {
            "Action": { color: "#fd7f6f" },
            "Comedy": { color: "#7eb0d5" },
            "Sci-Fi": { color: "#b2e061", },
            "Adventure": { color: "#bd7ebe" },
            "Music": { color: "#ffb55a" },
            "Game": { color: "#beb9db", },
            "Mystery": { color: "#fdcce5" },
            "Harem": { color: "#8bd3c7" },
            "Drama": { color: "#bbd2de" },
            "Slice of Life": { color: "#ffee65" },
        }

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
            .attr('x', 0)
            .attr('y', 20)
        // .text('View 2');

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

        console.log(vis.flattenedData);

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
            .attr("height", 0);

        // original
        // vis.bars = vis.chart.selectAll('.category')
        //     .data(vis.stackedData)
        //     .join('g')
        //     .attr('class', d => `category cat-${d.key}`)
        //     .attr("fill", function (d) { return vis.genreToInfo[d.key].color })
        //     .selectAll('rect')
        //     .data(d => d)
        //     .join('rect')
        //     .attr('x', d => vis.xScale(d.data.Year))
        //     .attr('y', d => vis.yScale(d[1]))
        //     .attr('height', d => vis.yScale(d[0]) - vis.yScale(d[1]))
        //     .attr('width', vis.xScale.bandwidth());

        // https://gist.github.com/mbostock/3887051
        // const group = vis.chart.selectAll("group")
        //     .data(vis.flattenedData)
        //     .join("g")
        //     .attr("transform", function (d) { return "translate(" + vis.xScale(d.Year) + ",0)"; }) // place each bar along the x-axis at the place defined by the xScale variable
        //     .selectAll("rect")
        //     .data(d => vis.valueKeys.map(key => ({ key, value: d[key] }))) // use the keys to access the data separately
        //     .join("rect")
        //     .attr("x", function (d) { return vis.x1(d.key); }) // use the x1 variable to place the grouped bars
        //     .attr("y", function (d) { return vis.yScale(d.value); }) // draw the height of the barse using the data from the keys as the height value
        //     .attr("width", vis.x1.bandwidth()) // bar is the width defined by the x1 variable
        //     .attr("height", d => vis.yScale(0) - vis.yScale(d.value))
        //     .attr("fill", function (d) { return vis.genreToInfo[d.key].color; });

        // Update axes
        vis.xAxisG.call(vis.xAxis).call((g) => g.select(".domain").remove());
        vis.yAxisG.call(vis.yAxis).call((g) => g.select(".domain").remove());

        // d3.selectAll("input").on("change", vis.change);
        d3.selectAll("input").on("change", change);

        function change() {
            if (this.value === "grouped") vis.transitionGrouped();
            if (this.value === "stacked") vis.transitionStacked();
        }
    }

    // change() {
    //     let vis = this;
    //     if (this.value === "grouped") {
    //         vis.transitionGrouped();
    //     }
    //     if (this.value === "stacked") {
    //         vis.transitionStacked();
    //     };
    //     // if (this.value === "grouped") console.log('group');
    //     // if (this.value === "stacked") console.log('stacked');
    // }

    transitionGrouped() {
        let vis = this;

        // vis.yScale.domain([0, d3.max(vis.flattenedData, d => d3.max(vis.genres, key => d[key]))]) // in each key, look for the maximum number

        console.log('test1');

        // group.transition()
        //     .duration(500)
        //     .delay((d, i) => i * 20)
        // .attr("x", (d, i) => x(i) + x.bandwidth() / n * d[2])
        // .attr("width", x.bandwidth() / n)
        // .transition()
        // .attr("y", d => y(d[1] - d[0]))
        // .attr("height", d => y(0) - y(d[1] - d[0]));


        // vis.rect
        //     .data(d => {vis.valueKeys.map(key => ({ key, value: d[key] }))}) // use the keys to access the data separately
        //     .transition()
        //     .duration(500)
        //     // .delay((d, i) => i * 20)
        //     .attr('x', d => {console.log(d); vis.xScale(d.data.Year)})
        //     .attr('y', d => vis.yScale(d[1]))
        //     .attr('width', vis.xScale.bandwidth())
        //     // .attr("height", d => vis.yScale(0) - vis.yScale(d.value))
        //     .attr("height", function (d) { console.log(d.value); return (vis.yScale(0) - vis.yScale(d.value)) })

        const group = vis.chart.selectAll("group")
            .data(vis.flattenedData)
            .join("g")
            .attr("transform", function (d) { return "translate(" + vis.xScale(d.Year) + ",0)"; }) // place each bar along the x-axis at the place defined by the xScale variable
            .selectAll("rect")
            .data(d => vis.valueKeys.map(key => ({ key, value: d[key] }))) // use the keys to access the data separately
            .join("rect")
            .attr("x", function (d) { console.log(d); return vis.x1(d.key); }) // use the x1 variable to place the grouped bars
            .attr("y", function (d) { return vis.yScale(d.value); }) // draw the height of the barse using the data from the keys as the height value
            .attr("width", vis.x1.bandwidth()) // bar is the width defined by the x1 variable
            .attr("height", d => vis.yScale(0) - vis.yScale(d.value))
            .attr("fill", function (d) { return vis.genreToInfo[d.key].color; });

    }

    transitionStacked() {
        let vis = this;

        vis.yScale.domain([0, d3.max(vis.flattenedData, d => d.Action + d['Sci-Fi'] + d.Drama + d['Slice of Life'] + d.Mystery + d.Comedy + d.Adventure + d.Game + d.Music + d.Harem)]);

        vis.bars.transition()
            .duration(500)
            .delay((d, i) => i * 20)
            .attr('y', d => vis.yScale(d[1]))
            .attr('height', d => vis.yScale(d[0]) - vis.yScale(d[1]))
            .transition()
            .attr('x', d => vis.xScale(d.data.Year))
            .attr('width', vis.xScale.bandwidth());

        // const bars = vis.chart.selectAll('.category')
        //     .data(vis.stackedData)
        //     .join('g')
        //     .attr('class', d => `category cat-${d.key}`)
        //     .attr("fill", function (d) { return vis.genreToInfo[d.key].color })
        //     .selectAll('rect')
        //     .data(d => d)
        //     .join('rect')
        //     .attr('x', d => vis.xScale(d.data.Year))
        //     .attr('y', d => vis.yScale(d[1]))
        //     .attr('height', d => vis.yScale(d[0]) - vis.yScale(d[1]))
        //     .attr('width', vis.xScale.bandwidth());
    }


}