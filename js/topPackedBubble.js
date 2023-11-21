class TopPackedBubbleChart {

    constructor(_config, _data, _genreToInfo, _dispatcher) {
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
        this.data = _data;
        this.genreToInfo = _genreToInfo;
        this.dispatcher = _dispatcher;
        this.clickedNode = null;
        this.currentlyZoomedOut = true;
        this.initVis();
      }

      
    initVis() {
        let vis = this;

        vis.config.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.config.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        // Define size of SVG drawing area
        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        vis.chartArea = vis.svg.append('g')
            .attr('class', 'top-level-group')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`)
            .attr('width', vis.config.width)
            .attr('height', vis.config.height);

        vis.chartArea.append('rect')
            .attr('width', vis.config.width)
            .attr('height', vis.config.height)
            .attr('fill', 'transparent')
            .on('click', (event, d) => {
                if (!d3.select(event.currentTarget).classed('.top-level-bubble-group') && !vis.currentlyZoomedOut) {
                    vis.zoomOut();
                }
            })
        
        vis.svg.append('rect')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight)
            .attr('rx', 10)          
            .attr('ry', 10)          
            .attr('fill', 'none')   
            .attr('stroke', 'grey') 
            .attr('stroke-width', '2px');
        

        vis.pack = d3.pack()
            .size([vis.config.containerWidth, vis.config.containerHeight])
            .padding(15);
        vis.radiusScale = d3.scaleSqrt().range([40,170]);

        vis.updateVis();
        vis.renderLegend();
    }

    updateVis() {
        let vis = this;

        vis.groupedAnimes = d3.groups(vis.data, d => d.Genre);

        vis.groupedAnimesObjects = vis.groupedAnimes.map(([genre, animes]) => {
            return {genre: genre, count: animes.length, animes: animes, isClickable: true};
        });


        vis.radiusScale.domain([d3.min(vis.groupedAnimesObjects, d => d.count), d3.max(vis.groupedAnimesObjects, d => d.count)]);

        vis.root = d3.hierarchy({ children: vis.groupedAnimesObjects })
            .sum(d => d.count);

        vis.nodes = vis.pack(vis.root).leaves();

        vis.renderVis();
    }

    renderVis() {
        // SOURCE: https://observablehq.com/@sharad/force-directed-bubble-chart

        let vis = this;

        vis.notClickableGlobal = true;

        const simulation = d3.forceSimulation(vis.nodes)
            .force("x", d3.forceX(vis.config.width / 2).strength(0.5))
            .force("y", d3.forceY(vis.config.height / 2).strength(0.5))
            .force('charge', d3.forceManyBody().strength(500))
            .force("collision", d3.forceCollide().radius(d => vis.radiusScale(d.data.count) + 2).strength(0.8));

        vis.bubblesGroups = vis.chartArea.selectAll('.top-level-bubble-group')
                .data(vis.nodes, d => d.data.genre)
            .join('g')
                .attr('class', 'top-level-bubble-group')
                .attr("transform", d => `translate(${d.x}, ${d.y})`)
                //.attr('fill', 'none')
                .attr('opacity', 0.7);


        vis.bubbles = vis.bubblesGroups.selectAll('.bubble')
                .data(d => d, d => d.data.genre)
            .join('circle')
                .on('click', (event, d) => {
                    console.log('clicked!!!!')
                    if (!vis.notClickableGlobal && d.data.isClickable) {
                        vis.zoomToBubble(d);
                    }
                })
                .on('mouseover', function(event, d) {
                    if (vis.clickedNode === null || d.data.genre !== vis.clickedNode.data.genre) {
                        d3.select(this)
                        .attr('stroke', '#2b2c41')  // Set the stroke to black on hover
                        .attr('stroke-width', 2); // Increase the stroke-width on hover
                    }
                })
                // Add mouseout event
                .on('mouseout', function(event, d) {
                    d3.select(this)
                      .attr('stroke', null)     // Reset the stroke on mouseout
                      .attr('stroke-width', null); // Reset the stroke-width on mouseout
                })
                .attr('class', 'bubble')
                .attr('r', d => vis.radiusScale(d.data.count))
                //.attr('stroke', '#000000')
                //.attr('stroke-width', 2)
                .attr('fill', d => vis.genreToInfo[d.data.genre].color);
        
        vis.genreText = vis.bubblesGroups.selectAll('.top-bubble-title')
                .data(d => d, d => d.data.genre)
            .join('text')
                .attr('class', 'top-bubble-title')
                .attr('dy', "0.25em")
                .attr('font-size', '15px')
                .attr('fill', 'black')
                .attr('font-weight', 'bold')
                .attr('text-anchor', 'middle')
                .text(d => d.data.genre)
                .attr("x", 0)
                .attr("y", (d, i, nodes) => `${i - nodes.length / 2 + 0.5}em`);
        

        simulation.on("tick", () => {
            vis.bubblesGroups.attr("transform", d => `translate(${d.x},${d.y})`);
        }).on("end", () => {
            vis.notClickableGlobal = false;
        });
    }


    zoomToBubble(currClickedNode) {
        let vis = this;
        vis.notClickableGlobal = true;
        const prevNode = vis.clickedNode;
        vis.clickedNode = currClickedNode;

        // Make current node notClickable and prev node clickable
        currClickedNode.data.isClickable = false;

        if (prevNode != null) {
            prevNode.data.isClickable = true;
        }
    
        // Calculate the scale for zooming
        const targetRadius = Math.min(vis.config.width, vis.config.height) / 2;
        const scale = targetRadius / vis.radiusScale(currClickedNode.data.count);
    
        // Calculate the translation needed to center the bubble
        // Adjust the translation to account for initial chart area translation
        const translateX = vis.config.width / 2 - scale * currClickedNode.x + vis.config.margin.left;
        const translateY = vis.config.height / 2 - scale * currClickedNode.y + vis.config.margin.top;

        // remove previous groups vis if it exists
        let bubbles = vis.svg.selectAll('.bubble-anime');
        let total = bubbles.size();
        let counter = 0;

        if (total === 0) {
            // Zooming in from global
            vis.applyLegendTransitionTopToDrillDown();
            vis.applyTransitionAndTextFade(translateX, translateY, scale, currClickedNode, prevNode);
            vis.currentlyZoomedOut = false;
            return;
        }

        // switch to other bubble
        bubbles.transition()
            .duration(250)
            .attr('opacity', 0)
            .on('end', () => {
                counter++;
                if (counter === total) {
                    // Only run code when all transitions complete
                    vis.svg.select('.anime-level-group').remove();

                    vis.genreText.each(function() {
                        let textElement = d3.select(this);
                        if (textElement.text() === prevNode.data.genre) {
                            // Apply fade-out transition to the matching element
                            textElement.transition()
                                .duration(500)
                                .style("opacity", 1)
                                .on('end', () => {
                                    vis.applyTransitionAndTextFade(translateX, translateY, scale, currClickedNode, prevNode);
                                });
                        }
                    });
                }
            });
    }

    zoomOut() {
        let vis = this;
        vis.notClickableGlobal = true;
        const prevNode = vis.clickedNode;
        vis.clickedNode = null;
        vis.currentlyZoomedOut = true;

        if (prevNode != null) {
            vis.applyLegendTransitionDrillDownToTop();
            prevNode.data.isClickable = true;
        }

        // remove previous groups vis if it exists
        vis.svg.selectAll('.bubble-anime').transition()
            .duration(250)
            .attr('opacity', 0)
            .on('end', () => {
                vis.svg.select('.anime-level-group').remove()

                vis.genreText.each(function() {
                    let textElement = d3.select(this);
                    if (textElement.text() === prevNode.data.genre) {
                        // Apply fade-out transition to the matching element
                        textElement.transition()
                            .duration(350)
                            .style("opacity", 1)
                            .on('end', () => {
                                vis.chartArea.transition()
                                    .duration(750)
                                    .attr("transform", `translate(${vis.config.margin.left},${vis.config.margin.top}) scale(1)`)
                                    .on('end', () => {
                                        vis.notClickableGlobal = false;
                                    });
                            });
                    }
                });
            });
    }

    renderLegend() {
        let vis = this;

        const circleDefinitions = [300, 200, 100, 50];
        //legend
        vis.svgLegend = d3.select(vis.config.parentElementLegend)
                          .attr('width', vis.config.legendWidth)
                          .attr('height', vis.config.legendHeight);
        
        vis.svgLegend.append('rect')
            .attr('width', vis.config.legendWidth)
            .attr('height', vis.config.legendHeight)    
            .attr('fill', 'transparent')
            .attr('stroke', 'grey') 
            .attr('stroke-width', '2px');

        vis.legendGroup = vis.svgLegend.append('g')
            .attr('class', 'legend');
        
        vis.legendGroup.append('text')
            .style('font-size', 14)
            .style('font-weight', 'bold')
            .attr('x', vis.config.legendWidth / 2)
            .attr('text-anchor', 'middle')
            .attr('y', 20)
            .text("The Number Of Anime In the Genre");
        
        vis.legendGroup.selectAll('.legend-item')
            .data(circleDefinitions)
            .enter()
            .append('circle')
            .attr('class', 'legend-item')
            .attr('fill', 'none')
            .attr('stroke', '#2b2c41')
            .attr('stroke-width', 2)
            .attr('r', d => vis.radiusScale(d))
            .attr('cx', vis.config.legendWidth / 2)
            .attr('cy', d => vis.config.legendHeight - vis.radiusScale(d));
        
        vis.legendGroup.selectAll('.legend-item-text')
            .data(circleDefinitions)
            .enter()
            .append('text')
            .attr('x', vis.config.legendWidth / 2) // Horizontal center of the circle
            .attr('y', d => vis.config.legendHeight - vis.radiusScale(d) * 2 - 10) // Above the circle
            .attr('class', 'legend-item-text')
            .attr('text-anchor', 'middle') 
            .style('alignment-baseline', 'top')
            .text(d => `${d}`)
            .attr('text-anchor', 'middle') // Center the text at the x position
            .attr('alignment-baseline', 'middle') // Center the text vertically
            .style('font-size', '12px'); // Set the font size
        }

      applyTransitionAndTextFade(translateX, translateY, scale, currClickedNode, prevNode) {
        let vis = this;
        let rerenderLegend = false;
        if (prevNode === null) {
            rerenderLegend = true;
        }
        vis.chartArea.transition()
            .duration(750)
            .attr("transform", `translate(${translateX}, ${translateY}) scale(${scale})`)
            .on("end", () => {
                vis.genreText.each(function() {
                    let textElement = d3.select(this);
                    if (textElement.text() === currClickedNode.data.genre) {
                        // Apply fade-out transition to the matching element
                        textElement.transition()
                            .duration(500)
                            .style("opacity", 0)
                            .on('end', () => {
                                vis.dispatcher.call('topToDrillDown', null, currClickedNode.data.genre, currClickedNode.data.animes, rerenderLegend);
                                vis.notClickableGlobal = false;
                            });
                    }
                });
            });
      }

      applyLegendTransitionTopToDrillDown() {
        let vis = this;
        vis.svgLegend.selectAll('.legend').transition()
        .duration(500)
        .style('opacity', 0)
        .on('end', () => {
            vis.svgLegend.selectAll('.legend-bubble').transition()
                    .duration(500)
                    .style('opacity', 1)
        });
      }

      applyLegendTransitionDrillDownToTop() {
        let vis = this;
        vis.svgLegend.selectAll('.legend-bubble').transition()
        .duration(500)
        .style('opacity', 0)
        .on('end', () => {
            vis.svgLegend.selectAll('.legend').transition()
                    .duration(500)
                    .style('opacity', 1)
        });
      }
      
}