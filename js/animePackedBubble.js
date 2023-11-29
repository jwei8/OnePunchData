class AnimePackedBubbleChart {

    constructor(_config, _genreToInfo, _globalMinScore, _globalMaxScore, _dispatcher) {
        this.config = {
          parentElement: _config.parentElement,
          parentElementLegend: _config.parentElementLegend,
          containerWidth: 750,
          containerHeight: 750,
          tooltipPadding: 15,
          margin: {
            top: 20,
            right: 20,
            bottom: 20,
            left: 20
          }
        }
        this.genreToInfo = _genreToInfo;
        this.globalMinScore = _globalMinScore;
        this.globalMaxScore = _globalMaxScore;
        this.selectedAnimes = [];
        this.dispatcher = _dispatcher;
        this.ratingToColor = {
            "G - All Ages": "#ffffff",
            "PG - Children": "#ffff00",
            "PG-13 - Teens 13 or older": "#75147c",
            "R - 17+ (violence & profanity)": "#ff0000",
            "R+ - Mild Nudity": "#000000",
        }
        this.initVis();

    }

    initVis() {
        let vis = this;

        vis.config.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.config.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        // Define size of SVG drawing area
        vis.svg = d3.select(vis.config.parentElement);

        vis.pack = d3.pack()
            .size([vis.config.containerWidth, vis.config.containerWidth])
            .padding(15);
        
        vis.radiusScale = d3.scaleLinear()
                        .range([6,30])
                        .domain([vis.globalMinScore, vis.globalMaxScore]);

        vis.renderLegend();

        // tooltip
        vis.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);
      }

    updateVis(genreToView, animeData) {
        let vis = this;

        vis.genre = genreToView;

        vis.anime = animeData.map(d => {
            return {
                ...d,
                Score: d.Score
            };
        });

        vis.root = d3.hierarchy({ children: vis.anime })
            .sum(d => d.Score);

        vis.nodes = vis.pack(vis.root).leaves();

        vis.renderVis();
    }

    renderVis() {
        let vis = this;

        vis.chartArea = vis.svg.append('g')
            .attr('class', 'anime-level-group')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`)
            .attr('width', vis.config.width)
            .attr('height', vis.config.height);

        const chargeStrength = d => vis.genreToInfo[vis.genre].chargeModifier * vis.radiusScale(d.data.Score);

        const simulation = d3.forceSimulation(vis.nodes)
            .force("x", d3.forceX(vis.config.width / 2).strength(0.5))
            .force("y", d3.forceY(vis.config.width / 2).strength(0.5))
            .force('charge', d3.forceManyBody().strength(chargeStrength))
            .force("collision", d3.forceCollide().radius(d => vis.radiusScale(d.data.Score) + 4).strength(0.8));
        
        const animeGroups = vis.chartArea.selectAll('.anime-level-bubble-group')
                .data(vis.nodes, d => d.data.MAL_ID)
            .join('g')
                .attr('class', 'anime-level-bubble-group')
                .attr("transform", d => `translate(${d.x}, ${d.y})`);

        const bubbles = animeGroups.selectAll('.bubble-anime')
                .data(d => d, d => d.data.MAL_ID)
            .join('circle')
                .on('click', (event, d) => {
                    console.log(d.data.MAL_ID);
                    if (!vis.selectedAnimes.includes(d.data.MAL_ID)) {
                        vis.selectedAnimes.push(d.data.MAL_ID);
                    } else {
                        const index = vis.selectedAnimes.indexOf(d.data.MAL_ID);
                         if (index > -1) {
                            vis.selectedAnimes.splice(index, 1);
                        }
                    }
                vis.dispatcher.call('selectAnimeOnClick', null, vis.selectedAnimes);
                })
                .on('mouseover', function(event, d) {
                    d3.select(this)
                        .attr('stroke', '#2b2c41')  // Set the stroke to black on hover
                        .attr('stroke-width', 2); // Increase the stroke-width on hover
                        
                    vis.tooltip.style("opacity", 1);
                    vis.tooltip.html(
                    `
                        <h3>${d.data.Name}</h3>
                        <ul>
                          <li>Score: ${d.data.Score}</li>
                          <li>Rating: ${d.data.Rating} years</li>
                          <li>Studio: ${d.data.Studios}</li>
                        </ul>
                    `)
                    })
                // Add mouseout event
                .on('mouseout', function(event, d) {
                    d3.select(this)
                        .attr('stroke', d => vis.selectedAnimes.includes(d.data.MAL_ID) ? '#2b2c41' : null)     // Reset the stroke on mouseout
                        .attr('stroke-width', d => vis.selectedAnimes.includes(d.data.MAL_ID) ? 2 : null); // Reset the stroke-width on mouseout
                    
                     vis.tooltip.style("opacity", 0);
                })
                .on('mousemove', (event) => {
                    // move tooltip
                    vis.tooltip
                      .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
                      .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
                })
                .attr('class', 'bubble-anime')
                .attr('r', d => vis.radiusScale(d.data.Score))
                .attr('fill', d => vis.ratingToColor[d.data.Rating])

        simulation.on("tick", () => {
            animeGroups.attr("transform", d => `translate(${d.x},${d.y})`);
        });

        bubbles.transition()
            .duration(500)
            .attr('opacity', 1);
    }

    
    updateChartByAnime(selectedAnimes) {
        let vis = this;
        const animeGroups = vis.chartArea.selectAll('.anime-level-bubble-group')
                .data(vis.nodes, d => d.data.MAL_ID);
        animeGroups.selectAll('.bubble-anime')
            .attr('stroke', d => vis.selectedAnimes.includes(d.data.MAL_ID) ? '#2b2c41': null)
            .attr('stroke-width',  d => vis.selectedAnimes.includes(d.data.MAL_ID) ? 2 : null);
    }

    renderLegend() {
        let vis = this;

        const scores = [7.5, 8.5, 9.5];

        const largestRadius = vis.radiusScale(scores[2]);

        const colortoRatingMap = [
            ["G - All Ages", 20, "G"],
            ["PG - Children", 50, "PG"],
            ["PG-13 - Teens 13 or older", 80, "PG-13"],
            ["R - 17+ (violence & profanity)", 110, "R"],
            ["R+ - Mild Nudity", 140, "R+"]
        ].map(([name, y, displayName]) => ({ name, y, displayName}));

        vis.legendGroup = vis.svg.append('g')
            .attr('class', 'legend-bubble')
            .style('opacity', 0);
        
        const topOffset = 40;
        const rightOffset = 20;

        vis.legendGroup.selectAll('.legend-bubble-item')
            .data(scores)
            .enter()
            .append('circle')
            .attr('class', 'legend-bubble-item')
            .attr('fill', 'none')
            .attr('stroke', '#2b2c41')
            .attr('stroke-width', 2)
            .attr('r', d => vis.radiusScale(d))
            .attr('cx', vis.config.containerWidth - (largestRadius) - rightOffset)
            .attr('cy', d =>  2 * largestRadius - vis.radiusScale(d) + topOffset);

        vis.legendGroup.append('text')
            .style('font-size', 14)
            .style('font-weight', 'bold')
            .attr('x',  vis.config.containerWidth - (largestRadius) - rightOffset)
            .attr('text-anchor', 'middle')
            .attr('y', topOffset)
            .attr('dy', -20)
            .text("Anime Score");
        
        vis.legendGroup.selectAll('.legend-bubble-item-text')
            .data(scores)
            .enter()
            .append('text')
            .attr('class', 'legend-bubble-item-text')
            .attr('x', vis.config.containerWidth - (largestRadius) - rightOffset) // Horizontal center of the circle
            .attr('y', d => 2 * largestRadius - (2 * vis.radiusScale(d)) + topOffset) // Above the circle
            .attr('dy', -5)
            .text(d => `${d}`)
            .attr('text-anchor', 'middle') // Center the text at the x position
            .attr('alignment-baseline', 'middle') // Center the text vertically
            .style('font-size', '12px'); // Set the font size 

        vis.legendGroupAge = vis.svg.append('g')
            .attr('class', 'legend-rating')
            .style('opacity', 0);

        const leftOffset = 20;

        //color encoding information
        vis.legendGroupAge.append('text')
            .attr('class', 'legend-rating-item-color-title')
            .style('font-size', 14)
            .style('font-weight', 'bold')
            .attr('x', leftOffset - 10)
            .attr('text-anchor', 'start')
            .attr('y', topOffset)
            .attr('dy', -20)
            .text("Age Rating");
        
        vis.legendGroupAge.selectAll('.legend-rating-item-color')
            .data(colortoRatingMap)
            .enter()
            .append('circle')
            .attr('class', 'legend-rating-item-color')
            .attr('fill', d => vis.ratingToColor[d.name])
            .attr('stroke', 'grey')
            .attr('stroke-width', 1)
            .attr('r', 10)
            .attr('cx', leftOffset)
            .attr('cy', d=> d.y + 20);
        
        vis.legendGroupAge.selectAll('.legend-rating-item-color-description')
            .data(colortoRatingMap)
            .enter()
            .append('text')
            .style('font-size', '15px')
            .attr('text-anchor', 'start')
            .attr('class', 'legend-rating-item-color-description')
            .text(d => d.displayName)
            .attr('x', leftOffset + 13)
            .attr('y', d => d.y + 24);
    }
}