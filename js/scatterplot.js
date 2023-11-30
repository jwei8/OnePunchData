class ScatterPlot {

    constructor(_config, _data, _genreToInfo, _dispatcher) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: 700,
            containerHeight: 800,
            margin: {
                top: 40,
                right: 40,
                bottom: 80,
                left: 80
            },
            // Todo: Add or remove attributes from config as needed
            tooltipPadding: 10, // Added a tooltip padding configuration
        }
        this.selectedGenre = null; // Initially, no genre is selected
        this.data = _data;
        this.genreToInfo = _genreToInfo;
        this.selectedAnimes = [];
        this.dispatcher = _dispatcher;
        this.initVis();
    }

    /**
     * We initialize scales/axes and append static elements, such as axis titles.
     */
    initVis() {
        let vis = this;

        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        // Extract genre names for the domain
        const genres = Object.keys(vis.genreToInfo);

        // Create the color scale
        vis.colorScale = d3.scaleOrdinal()
            .domain(genres)
            .range(genres.map(genre => vis.genreToInfo[genre].color));

        // Set up x-axis scale
        vis.xScale = d3.scaleLinear()
            .range([0, vis.width]);

        // Set up y-axis scale
        vis.yScale = d3.scaleLinear()
            .range([vis.height, 0]);

        // Set up x-axis
        vis.xAxis = d3.axisBottom(vis.xScale)
            .tickSizeOuter(0)
            .tickFormat(d3.format('.2f'));

        // Set up y-axis
        vis.yAxis = d3.axisLeft(vis.yScale)
            .tickSizeOuter(0)
            .tickFormat(d3.format('.2f')); // Use fixed-point notation with two decimal places

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
            .attr('x', 20)
            .attr('y', 20)
            .text('Correlation of Score VS Completed: Dropped ');

        // Append x-axis title
        vis.svg.append('text')
            .attr('class', 'axis-title')
            .attr('x', vis.config.containerWidth / 2)
            .attr('y', vis.config.containerHeight - 30) // Adjust the position as needed
            .style('text-anchor', 'middle')
            .text('Score');

        // Append y-axis title
        vis.svg.append('text')
            .attr('class', 'axis-title')
            .attr('transform', 'rotate(-90)')
            .attr('x', -vis.config.containerHeight / 2)
            .attr('y', 30) // Adjust the position as needed
            .style('text-anchor', 'middle')
            .text('Completed:Dropped Ratio');

        // Initialize stack generator and specify the categories or layers that we want to show in the chart
        vis.stack = d3.stack()
            .keys(['Action', 'Sci-Fi', 'Drama', 'Slice of Life', 'Mystery', 'Comedy', 'Adventure',
                'Game', 'Music', 'Harem']);

        // Initialize x-axis and append it to the chart
        vis.xAxisG.call(vis.xAxis);

        // Initialize y-axis and append it to the chart
        vis.yAxisG.call(vis.yAxis);

        // tooltip
        vis.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);
    }


    /**
     * Prepare the data and scales before we render it.
     */
    updateVis() {
        let vis = this;

        vis.colorValue = d => d.Genre;
        vis.xValue = d => d.Scored;
        vis.yValue = d => d.CompletedDroppedRatio;

        // Set the scale input domains
        vis.xScale.domain([d3.min(vis.data, vis.xValue), d3.max(vis.data, vis.xValue)]);
        vis.yScale.domain([d3.min(vis.data, vis.yValue), d3.max(vis.data, vis.yValue)]);

        // Update x-axis
        vis.xAxisG.call(vis.xAxis);

        // Update y-axis
        vis.yAxisG.call(vis.yAxis);

        // Render the visualization
        vis.renderVis();

    }

    renderVis() {
        let vis = this;

        vis.chart.selectAll('.point')
            .data(vis.data)
            .join('circle')
            .attr('class', 'point')
            .attr('r', 8)
            .style('fill-opacity', 0.65)
            .attr('cy', d => vis.yScale(vis.yValue(d)))
            .attr('cx', d => vis.xScale(vis.xValue(d)))
            .attr('fill', d => vis.colorScale(vis.colorValue(d)))
            .on('mouseover', (event, d) => {
                if (vis.selectedGenre === null || vis.selectedGenre === d.Genre) {
                    vis.tooltip.transition()
                        .duration(200)
                        .style("opacity", 1);
                    vis.tooltip.html(d.Name + "<br/> Score: " + d.Score + "<br/> Rating: " + d.Rating)
                        .style("left", (event.pageX) + "px")
                        .style("top", (event.pageY - 28) + "px");
                }
            })
            .on('mouseout', () => {
                vis.tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .on('click', (event, d) => {

                if (vis.selectedGenre === d.Genre && !vis.selectedAnimes.includes(d.MAL_ID)) {
                    vis.selectedAnimes.push(d.MAL_ID);
                } else if (vis.selectedGenre === d.Genre && vis.selectedAnimes.includes(d.MAL_ID)) {
                    const index = vis.selectedAnimes.indexOf(d.MAL_ID);
                    if (index > -1) {
                        vis.selectedAnimes.splice(index, 1);
                    }
                }
                vis.dispatcher.call('selectAnimeOnClickScatter', null, vis.selectedAnimes);
                vis.updateFilteredByAnime();
            })        

        // Render the legend
        vis.renderLegend();
    }


    renderLegend() {
        let vis = this;

        if (vis.svg.select('.legend').empty()) {
            vis.legend = vis.svg.append('g')
                .attr('class', 'legend')
                .attr('transform', `translate(${vis.config.containerWidth - 150},${20})`);
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
                //vis.updateFiltered();
                vis.updateLegendColors();
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
        //vis.updateFiltered();
    }

    updateChart(selectedGenre) {
        let vis = this;
        vis.selectedGenre = selectedGenre;
        vis.updateFiltered();
    }

    updateChartByAnime(selectedAnimes) {
        let vis = this;
        vis.selectedAnimes = selectedAnimes;
        vis.updateFilteredByAnime();
    }

    updateFiltered() {
        let vis = this;
        vis.chart.selectAll('.point')
            .attr('fill', d => (vis.selectedGenre === null|| vis.selectedGenre === d.Genre) ?
                vis.colorScale(d.Genre) : 'transparent')
            .each(function(d) {
                if (vis.selectedGenre === null || vis.selectedGenre === d.Genre) {
                    d3.select(this).raise(); // Bring the selected points to the front
                }
            });

        //vis.updateLegendColors();
    }

    updateFilteredByAnime() {
        let vis = this;
        vis.chart.selectAll('.point')
            .attr('stroke', d =>  vis.selectedAnimes.includes(d.MAL_ID) ?'#99ffff' : null)
            .attr('stroke-width',  d => vis.selectedAnimes.includes(d.MAL_ID) ? 4 : null)
            .attr('stroke-opacity',  d => vis.selectedAnimes.includes(d.MAL_ID) ? 1 : 0)
            .attr('fill-opacity', d => vis.selectedAnimes.includes(d.MAL_ID) ? 1 : 0.1)
            .each(function(d) {
                if (vis.selectedAnimes.includes(d.MAL_ID)) {
                    d3.select(this).raise(); // Bring the selected points to the front
                }
            });

        vis.updateFiltered();
    }

    updateLegendColors() {
        let vis = this;

        vis.legend.selectAll('.legend-entry rect')
            .attr('fill', d => vis.selectedGenre === null || vis.selectedGenre === d ? vis.colorScale(d) : '#d3d3d3')
            .attr('fill-opacity', d => vis.selectedGenre === null || vis.selectedGenre === d ? 1 : 0.3); // Lower opacity for greyed-out legend boxes
    }

}