class Barchart {

    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: 1200,
            containerHeight: 260,
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

        vis.xScale = d3.scaleBand()
            .range([0, vis.width])
            .padding(0.1)
            .paddingInner(0.2);

        vis.yScale = d3.scaleLinear()
            .range([vis.height, 0]);

        vis.xAxis = d3.axisBottom(vis.xScale)
            .ticks(6)
            .tickSizeOuter(0);

        vis.yAxis = d3.axisLeft(vis.yScale)
            // .ticks(6)
            .tickSize(-vis.width)
            .tickSizeOuter(0)
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
            .attr('y', 24)
            .text('View 2');
    }

    updateVis() {
        let vis = this;

        // Group the data by genre and year and calculate the count for each group
        var nestedData = d3.group(data, d => d.Genre, d => d.YearReleased);

        // Flatten the nested data structure
        vis.flattenedData = [];
        nestedData.forEach(function (genre, genreKey) {
            genre.forEach(function (year, yearKey) {
                vis.flattenedData.push({
                    Genre: genreKey,
                    Year: yearKey,
                    Count: year.length
                });
            });
        });
        console.log(vis.flattenedData);

        // Set the scale input domains
        vis.xScale.domain(vis.flattenedData.map(d => d.Year));
        vis.yScale.domain([0, d3.max(vis.flattenedData, d => d.Count)]);

        // let groupByGenre = d3.rollups(vis.data, v => v.length, d => d.Genre);
        // let genreCount = groupByGenre.map(data => data[1]);

        // var minYear = d3.min(vis.data, d => d.YearReleased);
        // var maxYear = d3.max(vis.data, d => d.YearReleased);

        // vis.xScale.domain([minYear, maxYear]) // year
        // vis.yScale.domain(genreCount); // count of anime per genre
        // vis.yScale.domain([0, d3.max(vis.genreCount)]);

        // vis.transformedData = groupByGenre.map(([year, count]) => ({
        //     year,
        //     count,
        // }));
        // console.log(vis.transformedData)

        vis.renderVis();
    }

    renderVis() {
        let vis = this;

        const bars = vis.chart.selectAll('.bar')
            .data(vis.flattenedData)
            .join('rect')
            .attr('class', 'bar')
            .attr('width', vis.xScale.bandwidth())
            .attr('height', d => vis.height - vis.yScale(d.Count))
            .attr('x', d => vis.xScale(d.Year))
            .attr('y', d => vis.yScale(d.Count))
        // .on("click", function (event, d) {
        //     // Check if current category is active and toggle class
        //     const isActive = d3.select(this).classed("active");

        //     d3.selectAll(".bar.active").classed("active", false);
        //     d3.select(this).classed("active", !isActive);
        // });

        // Update axes
        vis.xAxisG.call(vis.xAxis).call((g) => g.select(".domain").remove());
        vis.yAxisG.call(vis.yAxis).call((g) => g.select(".domain").remove());
    }
}