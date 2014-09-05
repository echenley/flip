/** @jsx React.DOM */

// Flip - A Game About Perspective
// ==============================
// Author:     Evan Henley
// Author URI: henleyedition.com

(function(React) {

    var levels = [
    {
        front: [['b','b','b','b','x'],
                ['','b','b','r',''],
                ['r','','yrb','r',''],
                ['r','b','b','br',''],
                ['','','','','']],
        back:  [['','','','',''],
                ['','','b','',''],
                ['','r','Ebr','',''],
                ['','','b','b','b'],
                ['','','f','','']],
        startPosition: { x: 0, y: 0 }
    },
    {
        front: [['','yr','','E'],
                ['','r','b',''],
                ['','','r',''],
                ['x','','r','x']],
        back:  [['','r','',''],
                ['yb','br','',''],
                ['x','','','k'],
                ['','','y','']],
        startPosition: { x: 0, y: 0 }
    },
    {
        front: [['b','bk','xb'],
                ['r','','b'],
                ['yr','x','E']],
        back:  [['','b','xb'],
                ['b','yrb','x'],
                ['x','','']],
        startPosition: { x: 0, y: 1 }
    }
    ];

    // add level number, height/width to each level object
    levels.forEach(function(level, i) {
        level.level = i + 1;
        level.height = level.front.length;
        level.width = level.front[0].length;
    });

    // COMPONENT: Game Board

    var Flip = React.createClass({displayName: 'Flip',

        toggleFold: function() {
            var unfold = this.state.unfold;
            this.setState({
                unfold: !unfold
            });
        },
        flip: function(axis, callback) {
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

            // Update Game State
            this.setState({
                playerPosition: playerPosition,
                flipX: flipX ? !this.state.flipX : this.state.flipX,
                flipY: flipY ? !this.state.flipY : this.state.flipY,
                flipped: !this.state.flipped
            });

            setTimeout(function() {
                if (callback) { callback(); }
                // check for events again
                this.performTileEvents(playerPosition, null, callback);
            }.bind(this), 500);
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

            function reEnableMove() {
                this.setState({
                    moveEnabled: true
                });
            }

            if (!this.state.moveEnabled) {
                return;
            }

            if (this.isValidMove(from, to, direction, tileset)) {

                this.setState({
                    moveEnabled: false
                });

                // Update Game State
                this.setState({ playerPosition: to });
                // perform any events on tile, with callback
                this.performTileEvents(to, tileset, reEnableMove.bind(this));
            }
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
        performTileEvents: function(tile, tileset, callback) {

            tileset = tileset || (this.state.flipped ? this.state.currentLevel.back : this.state.currentLevel.front);
            var tileCharacters = tileset[tile.y][tile.x].split('');

            function tileContains(letter) {
                return tileCharacters.indexOf(letter) !== -1;
            }

            this.setState({ menuStatus: 'Get to your car.' });

            if (tileContains('x')) {
                this.flip('x', callback);
            } else if (tileContains('y')) {
                this.flip('y', callback);
            } else if (tileContains('k') && !this.state.hasKey) {
                this.setState({
                    hasKey: true,
                    menuStatus: 'Got the key!'
                });
                callback();
            } else if (tileContains('f')) {
                // no callback
                this.setState({
                    menuStatus: 'Oops, burned alive!'
                });
            } else if (tileContains('E')) {
                this.checkWinCondition();
                callback();
            } else {
                callback();
            }
        },
        checkWinCondition: function() {
            if (!this.state.flipX && this.state.hasKey) {
                this.setState({
                    win: true,
                    menuStatus: 'You did it!'
                });
            } else if (this.state.flipX) {
                this.setState({ menuStatus: 'Your car is upside down!' });
            } else {
                this.setState({ menuStatus: 'Wait...where is your key?' });
            }
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

            var newBoardDimensions = this.getDimensions(levels[level].height, levels[level].width);

            this.setState({
                currentLevel: levels[level],
                playerPosition: {
                    x: levels[level].startPosition.x,
                    y: levels[level].startPosition.y
                },
                boardDimensions: newBoardDimensions,
                menuStatus: 'Get to your car.',
                moveEnabled: true,
                flipX: false,
                flipY: false,
                flipped: false,
                unfold: false,
                hasKey: false,
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
                moveEnabled: true,
                flipX: false,
                flipY: false,
                flipped: false,
                unfold: false,
                hasKey: false,
                win: false,
                menuStatus: 'Get to your car.',
                totalLevels: levels.length
            };
        },
        concatenateBoard: function(a, b) {
            // flatten tilesets into single array
            return a.concat(b);
        },
        render: function() {
            /* jshint ignore:start */
            var playerPosition = this.state.playerPosition;
            var wrapperClass = this.state.unfold ? 'unfold' : '';
            wrapperClass += this.state.flipX ? ' invert-x' : '';
            wrapperClass += this.state.hasKey ? ' hasKey' : '';
            return (
                React.DOM.div({id: "game-container"}, 
                    HeaderMenu({
                        level: this.state.currentLevel.level, 
                        totalLevels: this.state.totalLevels, 
                        titleClass: this.state.win ? 'spin' : '', 
                        changeLevel: this.changeLevel}), 
                    React.DOM.div({id: "game-board-wrapper", style: this.state.boardDimensions, className: wrapperClass}, 
                        GameBoard({
                            flipState: {
                                flipX: this.state.flipX,
                                flipY: this.state.flipY,
                                flipped: this.state.flipped
                            }, 
                            tileSets: {
                                front: this.state.currentLevel.front.reduce(this.concatenateBoard),
                                back: this.state.currentLevel.back.reduce(this.concatenateBoard)
                            }}), 
                        Player({
                            flipClass: this.state.flipped ? ' flip' : ' flip-back', 
                            position: {
                                x: this.state.flipY ? (this.state.currentLevel.width - playerPosition.x - 1) : playerPosition.x,
                                y: this.state.flipX ? (this.state.currentLevel.height - playerPosition.y - 1) : playerPosition.y
                            }})
                    ), 
                    Hint({status: this.state.menuStatus})
                )
            );
            /* jshint ignore:end */
        }
    });

    // COMPONENT: Header Group (title and level indicator)

    var HeaderMenu = React.createClass({displayName: 'HeaderMenu',
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
            return (
                /* jshint ignore:start */
                React.DOM.div({className: "header"}, 
                    React.DOM.h1({id: "title", className: this.props.titleClass}, React.DOM.span({className: "title-flip"}, "Flip"), " Flip"), 
                    React.DOM.h3({id: "subtitle"}, "Level ", this.props.level, "/", this.props.totalLevels), 
                    React.DOM.nav({className: "navigation"}, 
                        React.DOM.a({className: "nav-item icon-left", title: "Previous Level", onClick: this.prevLevelClickHandler}), 
                        React.DOM.a({className: "nav-item icon-refresh", title: "Restart Level", onClick: this.restartClickHandler}), 
                        React.DOM.a({className: "nav-item icon-right", title: "Next Level", onClick: this.nextLevelClickHandler})
                    )
                )
                /* jshint ignore:end */
            );
        }
    });

    var GameBoard = React.createClass({displayName: 'GameBoard',
        getGameBoardStyle: function() {
            var flipX = this.props.flipState.flipX,
                flipY = this.props.flipState.flipY;
            var rotateX = flipX ? '180deg' : 0,
                rotateY = flipY ? '180deg' : 0;

            var rotateStyle = 'rotateX(' + rotateX + ') rotateY(' + rotateY + ')';

            return {
                transform: rotateStyle,
                webkitTransform: rotateStyle
            };
        },
        render: function() {
            /* jshint ignore:start */
            var gameBoardStyle = this.getGameBoardStyle();
            return (
                React.DOM.div({id: "game-board", className: this.props.flipState.flipped ? 'flipped' : '', style: gameBoardStyle}, 
                    BoardFace({id: "game-board-front", tileset: this.props.tileSets.front}), 
                    BoardFace({id: "game-board-back", tileset: this.props.tileSets.back})
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

            // http://fortawesome.github.io/Font-Awesome/icons/
            var fullClass = {
                'E': ' icon-car',
                'x': ' icon-flip-x',
                'y': ' icon-flip-y',
                'b': ' wall-bottom',
                'r': ' wall-right',
                'k': ' icon-key',
                'f': ' icon-fire'
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
        getPosition: function() {
            var position = this.props.position;
            var tileWidth = 50;
            var gridTranslate = 'translate3d(' +
                (position.x * tileWidth) + 'px,' +
                (position.y * tileWidth) + 'px,0)';

            return {
                transform: gridTranslate,
                webkitTransform: gridTranslate
            };
        },
        render: function() {
            /* jshint ignore:start */
            var playerStyle = this.getPosition();
            return (
                React.DOM.div({className: 'tile icon-female' + this.props.flipClass, id: "player", style: playerStyle})
            );
            /* jshint ignore:end */
        }
    });

    // COMPONENT: Menu

    var Hint = React.createClass({displayName: 'Hint',
        render: function() {
            /* jshint ignore:start */
            return (
                React.DOM.div({id: "menu"}, 
                    React.DOM.p({className: "instruction"}, this.props.status)
                )
            );
            /* jshint ignore:end */
        }
    });

    React.renderComponent(
        Flip(null),
        document.getElementById('container')
    );

}(React));