class AnimePackedBubbleChart {

    constructor(_config, _genreToInfo, _globalMinScore, _globalMaxScore) {
        this.config = {
          parentElement: _config.parentElement,
          parentElementLegend: _config.parentElementLegend,
          containerWidth: 800,
          containerHeight: 800,
          legendWidth: 400,
          legendHeight: 400,
          tooltipPadding: 15,
          margin: {
            top: 40,
            right: 40,
            bottom: 40,
            left: 40
          }
        }
        this.genreToInfo = _genreToInfo;
        this.globalMinScore = _globalMinScore;
        this.globalMaxScore = _globalMaxScore;
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
      }

      updateVis(genreToView, animeData, rerenderLegend) {
        let vis = this;

        //PERHAPS SCALE DATA BY GLOBAL MINIMUM rather than just the minimum in the genre

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

        vis.rerenderLegend = rerenderLegend;

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
                    console.log(d.data)
                })
                .on('mouseover', function(event, d) {
                    d3.select(this)
                        .attr('stroke', '#2b2c41')  // Set the stroke to black on hover
                        .attr('stroke-width', 2); // Increase the stroke-width on hover
                })
                // Add mouseout event
                .on('mouseout', function(event, d) {
                    d3.select(this)
                      .attr('stroke', null)     // Reset the stroke on mouseout
                      .attr('stroke-width', null); // Reset the stroke-width on mouseout
                })
                .attr('class', 'bubble-anime')
                .attr('r', d => vis.radiusScale(d.data.Score))
                //.attr('stroke', '#000000')
               // .attr('stroke-width', 2)
                .attr('fill', d => vis.ratingToColor[d.data.Rating])
                .attr('opacity', 0);

        simulation.on("tick", () => {
            animeGroups.attr("transform", d => `translate(${d.x},${d.y})`);
        });

        bubbles.transition()
            .duration(500)
            .attr('opacity', 1);
      }


      renderLegend() {
        let vis = this;

        const scores = [7.5, 8.5, 9.5];

        const colortoRatingMap = [
            ["G - All Ages", vis.config.legendHeight / 2 + 20],
            ["PG - Children", vis.config.legendHeight / 2 + 50],
            ["PG-13 - Teens 13 or older", vis.config.legendHeight / 2 + 80],
            ["R - 17+ (violence & profanity)",vis.config.legendHeight / 2 + 110],
            ["R+ - Mild Nudity", vis.config.legendHeight / 2 + 140]
        ].map(([name, y]) => ({ name, y }));

        //legend
        vis.svgLegend = d3.select(vis.config.parentElementLegend)
                          .attr('width', vis.config.legendWidth)
                          .attr('height', vis.config.legendHeight);

        vis.legendGroup = vis.svgLegend.append('g')
            .attr('class', 'legend-bubble')
            .style('opacity', 0);

        
        vis.legendGroup.append('text')
            .style('font-size', 14)
            .style('font-weight', 'bold')
            .attr('x', vis.config.legendWidth / 2)
            .attr('text-anchor', 'middle')
            .attr('y', 20)
            .text("The Score of Anime In The Genre");
        
        vis.legendGroup.selectAll('.legend-bubble-item')
            .data(scores)
            .enter()
            .append('circle')
            .attr('class', 'legend-bubble-item')
            .attr('fill', 'none')
            .attr('stroke', '#2b2c41')
            .attr('stroke-width', 2)
            .attr('r', d => vis.radiusScale(d))
            .attr('cx', vis.config.legendWidth / 2)
            .attr('cy', d => vis.config.legendHeight - vis.radiusScale(d) - 250);
        
        vis.legendGroup.selectAll('.legend-bubble-item-text')
            .data(scores)
            .enter()
            .append('text')
            .attr('class', 'legend-bubble-item-text')
            .attr('x', vis.config.legendWidth / 2) // Horizontal center of the circle
            .attr('y', d => vis.config.legendHeight - vis.radiusScale(d) * 2 - 255) // Above the circle
            .text(d => `${d}`)
            .attr('text-anchor', 'middle') // Center the text at the x position
            .attr('alignment-baseline', 'middle') // Center the text vertically
            .style('font-size', '12px'); // Set the font size
        
        //color incoding information
        vis.legendGroup.append('text')
            .attr('class', 'legend-bubble-item-color-title')
            .style('font-size', 14)
            .style('font-weight', 'bold')
            .attr('x', vis.config.legendWidth / 2)
            .attr('text-anchor', 'middle')
            .attr('y', vis.config.legendHeight / 2)
            .text("The Anime Age Rating");
        
        vis.legendGroup.selectAll('.legend-bubble-item-color')
            .data(colortoRatingMap)
            .enter()
            .append('circle')
            .attr('class', 'legend-bubble-item-color')
            .attr('fill', d => vis.ratingToColor[d.name])
            .attr('stroke', 'grey')
            .attr('stroke-width', 1)
            .attr('r', 10)
            .attr('cx', vis.config.legendWidth / 4)
            .attr('cy', d=> d.y);
        
        vis.legendGroup.selectAll('.legend-bubble-item-color-description')
            .data(colortoRatingMap)
            .enter()
            .append('text')
            .style('font-size', '12px')
            .attr('class', 'legend-bubble-item-color-description')
            .text(d => d.name)
            .attr('x', vis.config.legendWidth / 4 + 20)
            .attr('y', d=> d.y + 4);
        }
}