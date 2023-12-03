class TopPackedBubbleChart {

    constructor(_config, _data, _genreToInfo, _dispatcher) {
        this.config = {
          parentElement: _config.parentElement,
          containerWidth: 860,
          containerHeight: 860,
          tooltipPadding: 15,
          margin: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
          },
          zoomMargin: {
            top: 25,
            right: 25,
            bottom: 25,
            left: 25
          }
        }
        this.data = _data;
        this.genreToInfo = _genreToInfo;
        this.dispatcher = _dispatcher;
        this.clickedNode = null;
        this.selectedGenre = null; // Initially, no genre is selected
        this.zoomedIn = false;
        this.notClickableGlobal = false;
        
        this.initVis();
      }

      
    initVis() {
        let vis = this;

        vis.config.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.config.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        vis.config.zoomWidth = vis.config.containerWidth - vis.config.zoomMargin.left - vis.config.zoomMargin.right;
        vis.config.zoomHeight = vis.config.containerHeight - vis.config.zoomMargin.top - vis.config.zoomMargin.bottom;

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
                if (!vis.notClickableGlobal && vis.zoomedIn && !d3.select(event.currentTarget).classed('.top-level-bubble-group')) {
                    vis.zoomOut();
                }
            })

        vis.pack = d3.pack()
            .size([vis.config.containerWidth, vis.config.containerHeight])
            .padding(15);

        vis.radiusScale = d3.scaleSqrt().range([42,182]);

        vis.renderTitle();
        vis.updateVis();
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
                .on('click', function(event, d) {
                    if (!vis.notClickableGlobal && d.data.isClickable) {
                        d3.select(this).select('.bubble')
                            .attr('stroke-width', 0);

                        vis.zoomToBubble(d);
                    }
                })
                .on('mouseover', function(event, d) {
                    if (vis.clickedNode === null || d.data.genre !== vis.clickedNode.data.genre) {
                        d3.select(this).select('.bubble') 
                            .attr('stroke', d => vis.genreToInfo[d.data.genre].color)
                            .attr('stroke-width', 10); 
                    }
                })
                .on('mouseout', function(event, d) {
                    d3.select(this).select('.bubble')  
                        .attr('stroke-width', 0);
                })
                .attr('class', 'top-level-bubble-group')
                .attr("transform", d => `translate(${d.x}, ${d.y})`)
                .attr('opacity', 0.9);

        vis.bubbles = vis.bubblesGroups.selectAll('.bubble')
                .data(d => d, d => d.data.genre)
            .join('circle')
                .attr('class', 'bubble')
                .attr('r', d => vis.radiusScale(d.data.count))
                .attr('stroke', '#2b2c41')  
                .attr('stroke-width', 0)
                .attr('fill', d => vis.genreToInfo[d.data.genre].color);
        
        vis.genreInfoGroup = vis.bubblesGroups.selectAll('.top-bubble-info')
                .data(d => d, d => d.data.genre) 
            .join('g')
                .attr('class', 'top-bubble-info')
                .attr("x", 0)
                .attr("y", (d, i, nodes) => `${i - nodes.length / 2 + 0.5}em`);

        
        vis.genreText = vis.genreInfoGroup.selectAll('.top-bubble-title')
                .data(d => d, d => d.data.genre)
            .join('text')
                .attr('class', 'top-bubble-title')
                .attr('dy', "0.25em")
                .attr('font-size', '15px')
                .attr('fill', 'black')
                .attr('font-weight', 'bold')
                .attr('text-anchor', 'middle')
                .text(d => d.data.genre)
        
        vis.genreCount = vis.genreInfoGroup.selectAll('.top-bubble-count')
                .data(d => d, d => d.data.genre)
            .join('text')
                .attr('class', 'top-bubble-count')
                .attr('dy', "1.5em")
                .attr('font-size', '15px')
                .attr('fill', 'black')
                .attr('font-weight', 'bold')
                .attr('text-anchor', 'middle')
                .text(d => d.data.count)

        simulation.on("tick", () => {
            vis.bubblesGroups.attr("transform", d => `translate(${d.x},${d.y})`);
        }).on("end", () => {
            vis.notClickableGlobal = false;
            vis.dispatcher.call('notClickableGlobal', null, vis.notClickableGlobal);
        });
    }

    selectGenre(genreName) {
        let vis = this;
        const bubbleToZoom = vis.nodes.find(node => node.data.genre === genreName);
        vis.zoomToBubble(bubbleToZoom);
    }


    zoomToBubble(currClickedNode) {
        let vis = this;
        vis.notClickableGlobal = true;
        const prevNode = vis.clickedNode;
        vis.clickedNode = currClickedNode;
        vis.zoomedIn = true;
        vis.dispatcher.call('clearSelectedAnimes', null, []);
        vis.dispatcher.call('notClickableGlobal', null, vis.notClickableGlobal);

        // Make current node notClickable and prev node clickable
        currClickedNode.data.isClickable = false;

        if (prevNode != null) {
            prevNode.data.isClickable = true;
        }
    
        // Calculate the scale for zooming
        const targetRadius = Math.min(vis.config.zoomWidth, vis.config.zoomHeight) / 2;
        const scale = targetRadius / vis.radiusScale(currClickedNode.data.count);
    
        // Calculate the translation needed to center the bubble
        // Adjust the translation to account for initial chart area translation
        const translateX = vis.config.zoomWidth / 2 - scale * currClickedNode.x + vis.config.zoomMargin.left;
        const translateY = vis.config.zoomHeight / 2 - scale * currClickedNode.y + vis.config.zoomMargin.top;

        // remove previous groups vis if it exists
        let bubbles = vis.svg.selectAll('.bubble-anime');
        let total = bubbles.size();
        let counter = 0;
        vis.dispatcher.call('mainToScatterGenreSelect', null, currClickedNode.data.genre)

        if (total === 0) {
            // Zooming in from global
            vis.applyLegendTransitionTopToDrillDown();
            vis.applyTransitionAndTextFade(translateX, translateY, scale, currClickedNode, prevNode);
            return;
        }

        // switch to other bubble
        bubbles.transition()
            .duration(350)
            .attr('opacity', 0)
            .on('end', () => {
                counter++;
                if (counter === total) {
                    // Only run code when all transitions complete
                    vis.svg.select('.anime-level-group').remove();

                    vis.genreInfoGroup.each(function() {
                        let currGroup = d3.select(this);
                        let textElement = currGroup.select('.top-bubble-title');
                        if (prevNode != null && (textElement.text() === prevNode.data.genre)) {
                            // Apply fade-out transition to the matching element
                            currGroup.transition()
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
        vis.dispatcher.call('notClickableGlobal', null, vis.notClickableGlobal);
        const prevNode = vis.clickedNode;
        vis.clickedNode = null;
        vis.zoomedIn = false;

        if (prevNode != null) {
            vis.applyLegendTransitionDrillDownToTop();
            prevNode.data.isClickable = true;
        }

        vis.dispatcher.call('mainToScatterGenreSelect', null, null);
        vis.dispatcher.call('clearSelectedAnimes', null, []);

        let bubbles = vis.svg.selectAll('.bubble-anime');
        let total = bubbles.size();
        let counter = 0;

        // remove previous groups vis if it exists
        bubbles.transition()
            .duration(350)
            .attr('opacity', 0)
            .on('end', () => {
                counter++;
                if (counter === total) {
                    vis.svg.select('.anime-level-group').remove()
                    vis.genreInfoGroup.each(function() {
                        let currGroup = d3.select(this);
                        let textElement = currGroup.select('.top-bubble-title');
                        if (textElement.text() === prevNode.data.genre) {
                            // Apply fade-out transition to the matching element
                            currGroup.transition()
                                .duration(500)
                                .style("opacity", 1)
                                .on('end', () => {
                                    vis.chartArea.transition()
                                        .duration(500)
                                        .attr("transform", `translate(${vis.config.margin.left},${vis.config.margin.top}) scale(1)`)
                                        .on('end', () => {
                                            vis.notClickableGlobal = false;
                                            vis.dispatcher.call('mainToDrillDown', null, null,null, null);
                                            vis.dispatcher.call('notClickableGlobal', null, vis.notClickableGlobal);
                                        });
                                });
                        }
                    });
                }
            });
    }

    
    renderTitle() {
        let vis = this;
    
        vis.legendTitleGroup = vis.svg.append('g')
            .attr('class', 'title')
            .attr('transform', `translate(${vis.config.width / 2},${14})`);
    
        // Append the first text element
        let text1 = vis.legendTitleGroup.append('text')
            .attr('class', 'title-topView-text')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .text("Top 10 Genres By Count Of Anime");
    
        // Append the second text element
        let text2 = vis.legendTitleGroup.append('text')
            .attr('class', 'title-drillDown-text')
            .style('opacity', 0)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .text("Animes in the Genre");
    }

    applyTransitionAndTextFade(translateX, translateY, scale, currClickedNode) {
        let vis = this;

        vis.chartArea.transition()
            .duration(750)
            .attr("transform", `translate(${translateX}, ${translateY}) scale(${scale})`)
            .on("end", () => {
                vis.genreInfoGroup.each(function() {
                    let currGroup = d3.select(this);
                    let textElement = currGroup.select('.top-bubble-title');
                    if (textElement.text() === currClickedNode.data.genre) {
                        // Apply fade-out transition to the matching element
                        currGroup.transition()
                            .duration(500)
                            .style("opacity", 0)
                            .on('end', () => {
                                vis.dispatcher.call('mainToDrillDown', null, currClickedNode.data.genre, currClickedNode.data.animes);
                                vis.notClickableGlobal = false;
                                vis.dispatcher.call('notClickableGlobal', null, vis.notClickableGlobal);
                            });
                    }
                });
            });
    }

    applyLegendTransitionTopToDrillDown() {
        let vis = this;

        vis.svg.selectAll('.legend-bubble').transition()
            .duration(750)
            .style('opacity', 1);
            
        vis.svg.selectAll('.legend-rating').transition()
            .duration(750)
            .style('opacity', 1);

        vis.legendTitleGroup.selectAll('.title-topView-text').transition()
            .duration(375)
            .style('opacity', 0)
            .on('end', () => {
                vis.legendTitleGroup.selectAll('.title-drillDown-text').transition()
                    .duration(375)
                    .style('opacity', 1);
            });
    }

    applyLegendTransitionDrillDownToTop() {
        let vis = this;

        vis.svg.selectAll('.legend-bubble').transition()
            .duration(750)
            .style('opacity', 0);

        vis.svg.selectAll('.legend-rating').transition()
            .duration(750)
            .style('opacity', 0);

        vis.legendTitleGroup.selectAll('.title-drillDown-text').transition()
            .duration(375)
            .style('opacity', 0)
            .on('end', () => {
                vis.legendTitleGroup.selectAll('.title-topView-text').transition()
                    .duration(375)
                    .style('opacity', 1);
            });
    }
      
}