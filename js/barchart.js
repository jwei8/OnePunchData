class Barchart {

    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: 1200,
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

        vis.xScale = d3.scaleBand()
            .range([0, vis.width])
            .padding(0.1)
            .paddingInner(0.2);

        vis.yScale = d3.scaleLinear()
            .range([vis.height, 0]);

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
            .text('View 2');

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
            let genres = ['Action', 'Sci-Fi', 'Drama', 'Slice of Life', 'Mystery', 'Comedy', 'Adventure', 'Game', 'Music', 'Harem'];
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

        // Call stack generator on the dataset
        vis.stackedData = vis.stack(vis.flattenedData);

        console.log(vis.stackedData);


        vis.renderVis();
    }

    renderVis() {
        let vis = this;

        const bars = vis.chart.selectAll('.category')
            .data(vis.stackedData)
            .join('g')
            .attr('class', d => `category cat-${d.key}`)
            .selectAll('rect')
            .data(d => d)
            .join('rect')
            .attr('x', d => vis.xScale(d.data.Year))
            .attr('y', d => vis.yScale(d[1]))
            .attr('height', d => vis.yScale(d[0]) - vis.yScale(d[1]))
            .attr('width', vis.xScale.bandwidth());

        // Update axes
        vis.xAxisG.call(vis.xAxis).call((g) => g.select(".domain").remove());
        vis.yAxisG.call(vis.yAxis).call((g) => g.select(".domain").remove());
    }
}