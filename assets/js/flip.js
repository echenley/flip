/** @jsx React.DOM */

// Flip - A Game About Perspective
// ==============================
// Author:     Evan Henley
// Author URI: henleyedition.com

(function(React) {

    // COMPONENT: Game Board

    var Flip = React.createClass({displayName: 'Flip',

        isFlipped: function() {
            // XOR (exclusive or)
            return this.state.flipX ? !this.state.flipY : this.state.flipY;
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

            gameBoard.classList.toggle('flipped');
            gameBoard.style.transform = 'rotateX(' + rotateX + ') rotateY(' + rotateY + ')';
            gameBoard.style.webkitTransform = 'rotateX(' + rotateX + ') rotateY(' + rotateY + ')';
        },
        flip: function(axis) {
            var player = document.getElementById('player'),
                playerPosition = this.state.playerPosition,
                widthOrHeight = axis === 'x' ? this.state.height : this.state.width,
                oppositeAxis = axis === 'x' ? 'y' : 'x',
                flipX = axis === 'x',
                flipY = axis === 'y';

            // update player position and css
            player.classList.toggle('flip');
            playerPosition[oppositeAxis] = (widthOrHeight - playerPosition[oppositeAxis] - 1);

            // calculate rotate3d css for #game-board
            this.rotate3d(axis);

            // Update Game State
            this.setState({
                playerPosition: playerPosition,
                flipX: flipX ? !this.state.flipX : this.state.flipX,
                flipY: flipY ? !this.state.flipY : this.state.flipY
            });

            // Check for win condition, update this.state.flipped
            // must happen after flipX and flipY are set
            setTimeout(function () {
                this.setState({
                    win: this.checkBoard(playerPosition),
                    flipped: this.isFlipped()
                });
                this.performTileEvents(playerPosition);
            }.bind(this), 400);

        },
        isValidMove: function(from, to, direction) {

            var tiles = this.state.tiles,
                flipped = this.isFlipped();

            if (this.state.flipX) { direction.y *= -1; }
            if (this.state.flipY) { direction.x *= -1; }

            function directionLetterOf(vector) {
                // capitals = back side
                if      (vector.x ===  1) { return flipped ? 'R' : 'r'; }
                else if (vector.x === -1) { return flipped ? 'L' : 'l'; }
                else if (vector.y ===  1) { return flipped ? 'B' : 'b'; }
                else if (vector.y === -1) { return flipped ? 'T' : 't'; }
            }

            function hasWallClass(tile, vector) {
                var tileCharacters = tiles[tile.y][tile.x].split('');
                var directionLetter = directionLetterOf(vector);
                return tileCharacters.indexOf(directionLetter) !== -1;
            }

            // edge of board
            if (to.x < 0 || to.x > this.state.width-1 || to.y < 0 || to.y > this.state.height-1) {
                return false;
            }

            var thereIsAWall = hasWallClass(from, direction) || hasWallClass(to, { x: -direction.x, y: -direction.y });
            if (thereIsAWall) {
                return false;
            }
            return true;
        },
        performTileEvents: function(tile) {
            var tiles = this.state.tiles;
            var tileCharacters = tiles[tile.y][tile.x].split('');

            if (!this.state.flipped) {
                if (tileCharacters.indexOf('x') !== -1) {
                    this.flip('x');
                } else if (tileCharacters.indexOf('y') !== -1) {
                    this.flip('y');
                }
            } else {
                if (tileCharacters.indexOf('X') !== -1) {

                } else if (tileCharacters.indexOf('Y') !== -1) {
                    this.flip('y');
                }
            }
        },
        move: function(direction) {

            var from = this.state.playerPosition;
            // invertX/Y used to invert direction when board is flipped
            var invertY = this.state.flipX ? -1 : 1,
                invertX = this.state.flipY ? -1 : 1;
            var to = {
                    x: from.x + (direction.x * invertX),
                    y: from.y + (direction.y * invertY)
                };

            if (this.isValidMove(from, to, direction)) {

                var player = document.getElementById('player');
                var translateY = this.state.flipX ? (this.state.height - to.y - 1) : to.y,
                    translateX = this.state.flipY ? (this.state.width - to.x - 1) : to.x;
                // width of each tile
                var tileWidth = player.offsetWidth;
                var gridTranslate = 'translate3d(' + (translateX * tileWidth) + 'px,' + (translateY * tileWidth) + 'px,0)';

                player.style.transform = gridTranslate;
                player.style.webkitTransform = gridTranslate;

                // Update Game State
                this.setState({
                    playerPosition: to,
                    win: this.checkBoard(to)
                });

                // perform any events on tile
                this.performTileEvents(to);
            }
        },
        checkBoard: function(playerPosition) {
            var goalPosition = this.state.goalPosition;
            // both or neither of flipX and flipY
            if (!this.isFlipped() &&
                playerPosition.x === goalPosition.x &&
                playerPosition.y === goalPosition.y) {
                return true;
            }
            return false;
        },
        getPlayerOffset: function() {
            var gameBoard = document.getElementById('game-board');
            // parseInt removes 'px'
            var borderWidth = parseInt(window.getComputedStyle(gameBoard).borderBottomWidth, 10);
            return {
                top: gameBoard.offsetTop + borderWidth,
                left: gameBoard.offsetLeft + borderWidth
            };
        },
        getDimensions: function() {
            var tileWidth = document.getElementById('player').offsetWidth;
            return {
                width: tileWidth * this.state.width + 'px',
                height: tileWidth * this.state.height + 'px'
            };
        },
        initialMap: function() {
            var board = [['','','r','',''],
                         ['','Y','r','',''],
                         ['','','r','',''],
                         ['','','r','','E'],
                         ['x','','r','','']];
            return {
                level: 1,
                board: board,
                height: board.length,
                width: board[0].length,
                startPosition: { x: 0, y: 0 },
                goalPosition: { x: 4, y: 3 }
            };
        },
        restartGame: function() {
            var gameBoard = document.getElementById('game-board'),
                player = document.getElementById('player'),
                tileWidth = player.offsetWidth;

            var gridTranslate = 'translate3d(' +
                                (this.state.startPosition.x * tileWidth) + 'px,' +
                                (this.state.startPosition.y * tileWidth) + 'px,0)';

            // clear style attributes
            player.style.transform = gridTranslate;
            player.style.webkitTransform = gridTranslate;
            player.classList.remove('flip');
            gameBoard.style.transform = '';
            gameBoard.style.webkitTransform = '';
            gameBoard.classList.remove('flipped');

            // set the state!
            this.setState(this.getInitialState());
            this.setState({
                boardDimensions: this.getDimensions()
            });
            this.setState({
                playerOffset: this.getPlayerOffset()
            });
        },
        handleKeyPress: function(e) {
            var key = e.keyCode;
            // stop arrow keys from scrolling and stuff
            if ([32,13,37,38,39,40].indexOf(key) !== -1) {
                e.preventDefault();
            }
            // don't do anything if already won
            if (this.state.win) { return; }

            // if (key === 32) { this.flip('x'); }      // spacebar
            // else if (key === 13) { this.flip('y'); } // enter
            if (key === 37) { this.move({x: -1, y:  0}); } // left
            else if (key === 38) { this.move({x:  0, y: -1}); } // up
            else if (key === 39) { this.move({x:  1, y:  0}); } // right
            else if (key === 40) { this.move({x:  0, y:  1}); } // down
        },
        componentDidMount: function() {
            // Keyboard Events
            window.addEventListener('keydown', this.handleKeyPress);
            // set essential state properties
            // playerOffset relies on boardDimensions
            this.setState({
                boardDimensions: this.getDimensions()
            });
            this.setState({
                playerOffset: this.getPlayerOffset()
            });
        },
        getInitialState: function() {
            var mapObj = this.initialMap();
            return {
                // generate the game board
                height: mapObj.height,
                width: mapObj.width,
                boardDimensions: { width: 0, height: 0 },
                playerOffset: { top: 0, left: 0 },
                // returns an array
                tiles: mapObj.board,
                startPosition: mapObj.startPosition,
                // startPosition and playerPosition can't point to the same object...yikes
                playerPosition: { x: mapObj.startPosition.x, y: mapObj.startPosition.y },
                goalPosition: mapObj.goalPosition,
                flipX: false,
                flipY: false,
                flipped: false,
                win: false
            };
        },
        render: function() {
            /* jshint ignore:start */
            // flatten tiles array
            var tiles = this.state.tiles.reduce(function(a, b) {
                return a.concat(b);
            });
            var status = this.state.win ? 'You win!' : 'Get to the flower.';
            return (
                React.DOM.div(null, 
                    React.DOM.div({id: "game-board", style: this.state.boardDimensions}, 
                        
                            tiles.map(function(tileText, position) {
                                return (
                                    Tile({tileText: tileText, key: position})
                                );
                            }, this)
                        
                    ), 
                    Player({boardOffset: this.state.playerOffset}), 
                    Menu({winClass: this.state.win ? 'button win' : 'button', status: status, restart: this.restartGame})
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
                'r': ' wall-right',
                'X': ' back-flip-x',
                'Y': ' back-flip-y',
                'B': ' back-wall-bottom',
                'R': ' back-wall-right'
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
                React.DOM.div({className: "tile", id: "player", style: this.props.boardOffset})
                /* jshint ignore:end */
            );
        }
    });

    // COMPONENT: Menu

    var Menu = React.createClass({displayName: 'Menu',
        clickHandler: function() {
            this.props.restart();
        },
        render: function() {
            return (
                /* jshint ignore:start */
                React.DOM.div({id: "menu"}, 
                    React.DOM.h3({id: "subtitle"}, this.props.status), 
                    React.DOM.a({className: this.props.winClass, onClick: this.clickHandler}, "Restart")
                )
                /* jshint ignore:end */
            );
        }
    });

    React.renderComponent(
        Flip(null),
        document.getElementById('game-container')
    );

}(React));