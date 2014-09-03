/** @jsx React.DOM */

// Flip - A Game About Perspective
// ==============================
// Author:     Evan Henley
// Author URI: henleyedition.com

(function(React) {

    var levels = [
    {
        level: 1,
        front: [['r','b','b'],
                ['r','','b'],
                ['yr','x','E']],
        back:  [['','b','xb'],
                ['b','yrb','x'],
                ['','','']],
        height: 3,
        width: 3,
        startPosition: { x: 0, y: 0 },
        goalPosition: { x: 2, y: 2}
    },
    {
        level: 2,
        front: [['','','r','y',''],
                ['','Y','r','',''],
                ['','','r','',''],
                ['','','r','','E'],
                ['x','','r','','']],
        height: 5,
        width: 5,
        startPosition: { x: 0, y: 0 },
        goalPosition: { x: 4, y: 3 }
    },
    {
        level: 3,
        front: [['','','Rr','y','',''],
                ['','Y','Rr','','',''],
                ['','','Rr','','E',''],
                ['','','Rr','','',''],
                ['x','','Rr','','',''],
                ['x','','Rr','','','']],
        height: 6,
        width: 6,
        startPosition: { x: 0, y: 0 },
        goalPosition: { x: 4, y: 2 }
    }
    ];

    // COMPONENT: Game Board

    var Flip = React.createClass({displayName: 'Flip',

        toggleFold: function() {
            var unfold = this.state.unfold;
            this.setState({
                unfold: !unfold
            });
        },
        rotate3d: function(axis) {
            var gameBoard = document.getElementById('game-board');
            var rotateX, rotateY;
            
            if (axis === 'x') {
                rotateX = !this.state.flipX ? '180deg' : 0;
                rotateY = this.state.flipY ? '180deg' : 0;
            } else {
                rotateX = this.state.flipX ? '180deg' : 0;
                rotateY = !this.state.flipY ? '180deg' : 0;
            }

            gameBoard.style.transform = 'rotateX(' + rotateX + ') rotateY(' + rotateY + ')';
            gameBoard.style.webkitTransform = 'rotateX(' + rotateX + ') rotateY(' + rotateY + ')';
        },
        flip: function(axis) {
            var playerPosition = this.state.playerPosition;
            var boardBoundary, oppositeAxis, flipX, flipY;

            if (axis === 'x') {
                boardBoundary = this.state.currentLevel.height;
                oppositeAxis = 'y';
                flipX = true;
                flipY = false;
            } else {
                boardBoundary = this.state.currentLevel.width;
                oppositeAxis = 'x';
                flipX = false;
                flipY = true;
            }

            // update player position and css
            playerPosition[oppositeAxis] = (boardBoundary - playerPosition[oppositeAxis] - 1);

            // calculate rotate3d css for #game-board
            this.rotate3d(axis);

            // Update Game State
            this.setState({
                playerPosition: playerPosition,
                flipX: flipX ? !this.state.flipX : this.state.flipX,
                flipY: flipY ? !this.state.flipY : this.state.flipY,
                flipped: !this.state.flipped
            });
        },
        isValidMove: function(from, to, direction, tileset) {
            var wallExists;

            if (this.state.flipX) { direction.y *= -1; }
            if (this.state.flipY) { direction.x *= -1; }

            function directionLetterOf(vector) {
                // capitals = back side
                if      (vector.x ===  1) { return 'r'; }
                else if (vector.y ===  1) { return 'b'; }
            }

            function hasWallClass(tile, vector) {
                var tileCharacters = tileset[tile.y][tile.x].split('');
                var directionLetter = directionLetterOf(vector);
                return tileCharacters.indexOf(directionLetter) !== -1;
            }

            // edge of board
            if (to.x < 0 || to.x > this.state.currentLevel.width-1 ||
                to.y < 0 || to.y > this.state.currentLevel.height-1) {
                return false;
            }

            // right or down
            if (direction.x === 1 || direction.y === 1) {
                wallExists = hasWallClass(from, direction);
            } else {
                // left or up
                wallExists = hasWallClass(to, {
                    x: -direction.x,
                    y: -direction.y
                });
            }

            if (wallExists) {
                return false;
            }
            return true;
        },
        performTileEvents: function(tile, tileset) {

            tileset = tileset || (this.state.flipped ? this.state.currentLevel.back : this.state.currentLevel.front);

            var tileCharacters = tileset[tile.y][tile.x].split(''),
                playerPosition = this.state.playerPosition;

            function afterFlip() {
                // check for win
                this.setState({
                    win: this.checkBoard(playerPosition),
                });
                // check for events
                this.performTileEvents(playerPosition);
            }

            function flipAndRecurse(axis) {
                this.flip(axis);
                setTimeout(afterFlip.bind(this), 400);
            }

            if (tileCharacters.indexOf('x') !== -1) {
                flipAndRecurse.call(this, 'x');
            } else if (tileCharacters.indexOf('y') !== -1) {
                flipAndRecurse.call(this, 'y');
            }
        },
        move: function(direction) {
            var tileset = this.state.flipped ? this.state.currentLevel.back : this.state.currentLevel.front;
            var from = this.state.playerPosition;
            // invertX/Y used to invert direction when board is flipped
            var invertY = this.state.flipX ? -1 : 1,
                invertX = this.state.flipY ? -1 : 1;
            var to = {
                x: from.x + (direction.x * invertX),
                y: from.y + (direction.y * invertY)
            };

            if (this.isValidMove(from, to, direction, tileset)) {

                var player = document.getElementById('player');
                var translateY = this.state.flipX ? (this.state.currentLevel.height - to.y - 1) : to.y,
                    translateX = this.state.flipY ? (this.state.currentLevel.width - to.x - 1) : to.x;
                var gridTranslate = this.getGridTranslate(translateX, translateY);

                player.style.transform = gridTranslate;
                player.style.webkitTransform = gridTranslate;

                // Update Game State
                this.setState({
                    playerPosition: to,
                    win: this.checkBoard(to)
                });

                // perform any events on tile
                this.performTileEvents(to, tileset);
            }
        },
        checkBoard: function(playerPosition) {
            var goalPosition = this.state.currentLevel.goalPosition;
            // both or neither of flipX and flipY
            if (!this.state.flipped &&
                playerPosition.x === goalPosition.x &&
                playerPosition.y === goalPosition.y) {
                return true;
            }
            return false;
        },
        getGridTranslate: function(x, y) {
            var tileWidth = document.getElementById('player').offsetWidth;
            return 'translate3d(' +
                (x * tileWidth) + 'px,' +
                (y * tileWidth) + 'px,0)';
        },
        getDimensions: function(height, width) {
            var tileWidth = document.getElementById('player').offsetWidth;
            return {
                height: tileWidth * height + 6 + 'px',
                width: tileWidth * width + 6 + 'px'
            };
        },
        changeLevel: function(level) {

            if (!levels[level]) { return; }

            var gameBoard = document.getElementById('game-board'),
                player = document.getElementById('player');
            var gridTranslate = this.getGridTranslate(this.state.currentLevel.startPosition.x, this.state.currentLevel.startPosition.y);
            var newBoardDimensions = this.getDimensions(levels[level].height, levels[level].width);


            // clear style attributes
            player.style.transform = gridTranslate;
            player.style.webkitTransform = gridTranslate;
            gameBoard.style.transform = '';
            gameBoard.style.webkitTransform = '';

            this.setState({
                currentLevel: levels[level],
                playerPosition: {
                    x: levels[level].startPosition.x,
                    y: levels[level].startPosition.y
                },
                boardDimensions: newBoardDimensions,
                flipX: false,
                flipY: false,
                flipped: false,
                win: false
            });
        },
        handleKeyEvent: function(e) {
            var key = e.keyCode;

            // don't do anything if already won
            if (this.state.win) { return; }

            // stop arrow keys from scrolling and stuff
            if ([32,37,38,39,40].indexOf(key) !== -1) {
                e.preventDefault();
            }

            if (!this.state.unfold) {
                if (key === 32) {
                    this.toggleFold();
                }
                else if (key === 37) { this.move({x: -1, y:  0}); } // left
                else if (key === 38) { this.move({x:  0, y: -1}); } // up
                else if (key === 39) { this.move({x:  1, y:  0}); } // right
                else if (key === 40) { this.move({x:  0, y:  1}); } // down
            } else {
                this.toggleFold();
            }
        },
        componentDidMount: function() {
            // Keyboard Events
            window.addEventListener('keydown', this.handleKeyEvent);
            // set essential state properties
            this.setState({
                boardDimensions: this.getDimensions(this.state.currentLevel.height, this.state.currentLevel.width)
            });
        },
        getInitialState: function() {
            return {
                currentLevel: levels[0],
                playerPosition: {
                    x: levels[0].startPosition.x,
                    y: levels[0].startPosition.y
                },
                boardDimensions: { width: 0, height: 0 },
                flipX: false,
                flipY: false,
                flipped: false,
                unfold: false,
                win: false
            };
        },
        render: function() {
            /* jshint ignore:start */
            // flatten tilesets into single array
            function concatenate(a, b) {
                return a.concat(b);
            };

            var frontTiles = this.state.currentLevel.front.reduce(concatenate),
                backTiles = this.state.currentLevel.back.reduce(concatenate);
            var menuStatus = this.state.win ? 'You win!' : 'Get to the flower.';
            var unfoldClass = this.state.unfold ? 'unfold' : '';
            unfoldClass += this.state.flipX ? ' invert-x' : '';
            return (
                React.DOM.div(null, 
                    React.DOM.div({id: "game-board-wrapper", style: this.state.boardDimensions, className: unfoldClass}, 
                        React.DOM.div({id: "game-board", className: this.state.flipped ? 'flipped' : ''}, 
                            BoardFace({id: "game-board-front", tileset: frontTiles}), 
                            BoardFace({id: "game-board-back", tileset: backTiles})
                        ), 
                        Player({flipClass: this.state.flipped ? ' flip' : ''})
                    ), 
                    Menu({winClass: this.state.win ? 'win' : '', 
                        level: this.state.currentLevel.level, 
                        changeLevel: this.changeLevel, 
                        status: menuStatus})
                )
            );
            /* jshint ignore:end */
        }
    });

    // COMPONENT: Single Side of Board

    var BoardFace = React.createClass({displayName: 'BoardFace',
        render: function() {
            /* jshint ignore:start */
            var tiles = this.props.tileset;
            return (
                React.DOM.div({id: this.props.id, className: this.props.classes, style: this.props.boardDimensions}, 
                    
                        tiles.map(function(tileText, position) {
                            return (
                                Tile({tileText: tileText, key: position})
                            );
                        }, this)
                    
                )
            );
            /* jshint ignore:end */
        }
    });

    // COMPONENT: Single Tile

    var Tile = React.createClass({displayName: 'Tile',
        getTileClassOf: function(tileText) {
            var tileClass = 'tile';

            if (!tileText) {
                return tileClass;
            }

            var fullClass = {
                'E': ' exit',
                'x': ' flip-x',
                'y': ' flip-y',
                'b': ' wall-bottom',
                'r': ' wall-right'
            };
            tileText = tileText.split('');

            tileText.forEach(function(c) {
                tileClass += fullClass[c] || '';
            });

            return tileClass;
        },
        render: function() {
            return (
                /* jshint ignore:start */
                React.DOM.div({className: this.getTileClassOf(this.props.tileText)})
                /* jshint ignore:end */
            );
        }
    });

    // COMPONENT: Player Tile

    var Player = React.createClass({displayName: 'Player',
        render: function() {
            return (
                /* jshint ignore:start */
                React.DOM.div({className: 'tile' + this.props.flipClass, id: "player"})
                /* jshint ignore:end */
            );
        }
    });

    // COMPONENT: Menu

    var Menu = React.createClass({displayName: 'Menu',
        restartClickHandler: function() {
            this.props.changeLevel(this.props.level-1);
        },
        nextLevelClickHandler: function() {
            this.props.changeLevel(this.props.level);
        },
        prevLevelClickHandler: function() {
            if (this.props.level > 1) {
                this.props.changeLevel(this.props.level-2);
            }
        },
        render: function() {
            /* jshint ignore:start */
            var winClass = 'button ' + this.props.winClass;
            return (
                React.DOM.div({id: "menu"}, 
                    React.DOM.h3({id: "subtitle"}, "Level ", this.props.level), 
                    React.DOM.p(null, this.props.status), 
                    React.DOM.p(null, 
                        React.DOM.a({className: "button", onClick: this.prevLevelClickHandler}, "Previous Level"), 
                        React.DOM.a({className: "button", onClick: this.restartClickHandler}, "Restart"), 
                        React.DOM.a({className: winClass, onClick: this.nextLevelClickHandler}, "Next Level")
                    )
                )
            );
            /* jshint ignore:end */
        }
    });

    React.renderComponent(
        Flip(null),
        document.getElementById('game-container')
    );

}(React));