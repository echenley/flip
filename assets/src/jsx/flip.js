/** @jsx React.DOM */

// Flip - A Game About Perspective
// ==============================
// Author:     Evan Henley
// Author URI: henleyedition.com

(function(React,zoom) {

    React.initializeTouchEvents(true);

    var PureRenderMixin = React.addons.PureRenderMixin;
    var moveEnabled = false;
    var touchable = true;
    var keyIsDown = false;
    var zoomed = false;

    var levels = [
    {
        front: [['b','bk','x'],
                ['r','','b'],
                ['yr','x','E']],
        back:  [['','b','xb'],
                ['b','yrb','x'],
                ['x','',' ']],
        startPosition: { x: 0, y: 1 }
    },
    {
        front: [['','yr','','E'],
                ['','r','b',''],
                ['','','r',''],
                ['x','f','r','x']],
        back:  [['','fr','',''],
                ['yb','br','',''],
                ['x','','','k'],
                ['','','y','']],
        startPosition: { x: 0, y: 0 }
    },
    {
        front: [['b','b','yb','fb','k'],
                ['','b','b','yr',''],
                ['r','','xrb','r',''],
                ['yr','b','b','br','y'],
                ['','','x','f','']],
        back:  [['r','xr','r','ybr','x'],
                ['yr','r','b','b',''],
                ['r','fr','Eb','xr','by'],
                ['r','b','b','b','b'],
                ['','x','f','','y']],
        startPosition: { x: 0, y: 0 }
    }
    ];

    // add level number, height/width to each level object
    levels.forEach(function(level, i) {
        level.level = i + 1;
        level.height = level.front.length;
        level.width = level.front[0].length;
    });

    // COMPONENT: Game Board

    var Flip = React.createClass({

        mixins: [PureRenderMixin],

        toggleZoom: function() {
            if (zoomed) {
                zoom.out();
            } else {
                zoom.to({
                    element: document.getElementById('game-board-wrapper')
                });
            }
            zoomed = !zoomed;
        },
        togglePeek: function() {
            var peek = this.state.peek;
            var flipped = this.state.flipped;
            this.setState({
                peek: !peek,
                flipped: !flipped
            });
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
            playerPosition[oppositeAxis] = boardBoundary - playerPosition[oppositeAxis] - 1;

            // Update Game State
            this.setState({
                playerPosition: playerPosition,
                flipX: flipX ? !this.state.flipX : this.state.flipX,
                flipY: flipY ? !this.state.flipY : this.state.flipY,
                flipped: !this.state.flipped
            });

            setTimeout(function() {
                // check for events again
                this.performTileEvents(playerPosition);
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

            if (!moveEnabled || this.state.death) {
                return;
            }

            if (this.isValidMove(from, to, direction, tileset)) {
                // disable movement while action takes place
                moveEnabled = false;
                // update game state
                this.setState({ playerPosition: to });
                // wait for move to complete, then perform any events on tile
                setTimeout(function() {
                    this.performTileEvents(to, tileset);
                }.bind(this), 100);
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

            function hasWallClass(tile, directionLetter) {
                var tileCharacters = tileset[tile.y][tile.x].split('');
                return tileCharacters.indexOf(directionLetter) !== -1;
            }

            // edge of board
            if (to.x < 0 || to.x > this.state.currentLevel.width-1 ||
                to.y < 0 || to.y > this.state.currentLevel.height-1) {
                return false;
            }

            // right or down
            if (direction.x === 1 || direction.y === 1) {
                wallExists = hasWallClass(from, directionLetterOf(direction));
            } else {
                // left or up
                wallExists = hasWallClass(to, directionLetterOf({ x: -direction.x, y: -direction.y }));
            }

            if (wallExists) {
                return false;
            }
            return true;
        },
        performTileEvents: function(tile, tileset) {

            tileset = tileset || (this.state.flipped ? this.state.currentLevel.back : this.state.currentLevel.front);
            var tileCharacters = tileset[tile.y][tile.x].split('');
            var newState = {};

            function tileContains(letter) {
                return tileCharacters.indexOf(letter) !== -1;
            }

            if (tileContains('x')) {
                this.flip('x');
            } else if (tileContains('y')) {
                this.flip('y');
            } else {
                if (tileContains('k') && !this.state.hasKey) {
                    newState.hasKey = true;
                    newState.menuStatus = 'Got the key!';
                } else if (tileContains('f')) {
                    newState.menuStatus = 'Oops, burned alive!';
                    newState.death = true;
                } else if (tileContains('E')) {
                    this.checkWinCondition();
                } else {
                    newState.menuStatus = 'Get to your spaceship.';
                }

                // set that state
                this.setState(newState);
                // re-enable movement
                moveEnabled = true;
            }

        },
        checkWinCondition: function() {
            var newState = {};
            if (!this.state.flipX && this.state.hasKey) {
                if (zoomed) {
                    zoom.out();
                }
                newState.win = true;
                newState.menuStatus = 'You did it!';
            } else if (this.state.flipX) {
                newState.menuStatus = 'Your ship is upside down!';
            } else {
                newState.menuStatus = 'Oh no...where is your key?';
            }
            this.setState(newState);
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
                menuStatus: 'Get to your spaceship.',
                flipX: false,
                flipY: false,
                flipped: false,
                peek: false,
                hasKey: false,
                win: false,
                death: false
            });
        },
        beforeMove: function(direction) {
            // don't do anything if already won
            if (this.state.win) { return; }
            if (this.state.peek) {
                this.togglePeek();
            } else {
                this.move(direction);
            }
        },
        handleKeyEvent: function(e) {
            var key = e.keyCode;

            // stop arrow keys/spacebar from scrolling
            if ([32,37,38,39,40,82].indexOf(key) !== -1) {
                if (e.metaKey || e.ctrlKey) {  
                    return;
                }
                e.preventDefault();
            }

            // prevent multiple firings of spacebar with keyIsDown
            if (key === 32 && !keyIsDown) {
                keyIsDown = true;
                this.togglePeek();
            }
            else if (key === 37) { this.beforeMove({x: -1, y:  0}); } // left
            else if (key === 38) { this.beforeMove({x:  0, y: -1}); } // up
            else if (key === 39) { this.beforeMove({x:  1, y:  0}); } // right
            else if (key === 40) { this.beforeMove({x:  0, y:  1}); } // down
            else if (key === 82) { this.changeLevel(this.state.currentLevel.level - 1); }
            else if (key === 188) { this.changeLevel(this.state.currentLevel.level - 2); }
            else if (key === 190) { this.changeLevel(this.state.currentLevel.level); }
        },

        componentDidMount: function() {
            // Keyboard Events
            window.addEventListener('keydown', this.handleKeyEvent);
            window.addEventListener('keyup', function() {
                keyIsDown = false;
            });

            // set essential state properties
            this.setState({
                boardDimensions: this.getDimensions(this.state.currentLevel.height, this.state.currentLevel.width),
                peek: false
            });

            setTimeout(function() {
                moveEnabled = true;
            }, 1000);
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
                peek: true,
                hasKey: false,
                win: false,
                death: false,
                menuStatus: 'Get to your spaceship.',
                totalLevels: levels.length
            };
        },
        concatenateBoard: function(a, b) {
            // flatten tilesets into single array
            return a.concat(b);
        },
        render: function() {
            /* jshint ignore:start */

            var cx = React.addons.classSet;
            var wrapperClasses = cx({
                'peek': this.state.peek,
                'hasKey': this.state.hasKey,
                'win': this.state.win
            });
            var gameBoardClasses = cx({
                'flipped': this.state.flipped,
                'flipX': this.state.flipX,
                'flipY': this.state.flipY
            });
            var playerClasses = cx({
                'tile': true,
                'icon-female': true,
                'flip': this.state.flipped,
                'unflip': !this.state.flipped,
                'dead': this.state.death
            });
            var playerPosition = this.state.playerPosition;
            var gridPosition = {
                x: this.state.flipY ? (this.state.currentLevel.width - playerPosition.x - 1) : playerPosition.x,
                y: this.state.flipX ? (this.state.currentLevel.height - playerPosition.y - 1) : playerPosition.y
            };
            return (
                <div id="game-container">
                    <HeaderMenu
                        level={this.state.currentLevel.level}
                        totalLevels={this.state.totalLevels}
                        titleClass={this.state.win ? 'spin' : ''}
                        changeLevel={this.changeLevel} />
                    <div id="game-board-wrapper" style={this.state.boardDimensions} className={wrapperClasses} onClick={this.toggleZoom}>
                        <GameBoard
                            gameBoardClasses={gameBoardClasses}
                            tileSets={{
                                front: this.state.currentLevel.front.reduce(this.concatenateBoard),
                                back: this.state.currentLevel.back.reduce(this.concatenateBoard)
                            }} />
                        <Player
                            playerClass={playerClasses}
                            peeking={this.state.peek}
                            position={gridPosition} /> 
                    </div>
                    <Hint status={this.state.menuStatus} />
                    <Controls sendMove={this.beforeMove} sendPeek={this.togglePeek} />
                </div>
            );
            /* jshint ignore:end */
        }
    });

    // COMPONENT: Header Group (title and level indicator)

    var HeaderMenu = React.createClass({
        toggleTouchable: function() {
            touchable = false;
            setTimeout(function() {
                touchable = true;
            }, 500);
        },
        restartClickHandler: function() {
            this.toggleTouchable();
            this.props.changeLevel(this.props.level-1);
        },
        nextLevelClickHandler: function() {
            this.toggleTouchable();
            this.props.changeLevel(this.props.level);
        },
        prevLevelClickHandler: function() {
            this.toggleTouchable();
            if (this.props.level > 1) {
                this.props.changeLevel(this.props.level-2);
            }
        },
        render: function() {
            return (
                /* jshint ignore:start */
                <div className="header">
                    <h1 id="title" className={this.props.titleClass}><span className="title-flip">Flip</span> Flip</h1>
                    <h3 id="subtitle">Level {this.props.level}/{this.props.totalLevels}</h3>
                    <nav className="navigation">
                        <a className="nav-item icon-left clickable" title="Previous Level" onClick={this.prevLevelClickHandler} onTouchEnd={this.prevLevelClickHandler}></a>
                        <a className="nav-item icon-refresh clickable" title="Restart Level" onClick={this.restartClickHandler} onTouchEnd={this.restartClickHandler}></a>
                        <a className="nav-item icon-right clickable" title="Next Level" onClick={this.nextLevelClickHandler} onTouchEnd={this.nextLevelClickHandler}></a>
                    </nav>
                </div>
                /* jshint ignore:end */
            );
        }
    });

    var GameBoard = React.createClass({
        render: function() {
            /* jshint ignore:start */
            return (
                <div id="game-board" className={this.props.gameBoardClasses}>
                    <BoardFace id="game-board-front" tileset={this.props.tileSets.front} />
                    <BoardFace id="game-board-back" tileset={this.props.tileSets.back} />
                </div>
            );
            /* jshint ignore:end */
        }
    });

    // COMPONENT: Single Side of Board

    var BoardFace = React.createClass({
        render: function() {
            /* jshint ignore:start */
            var tiles = this.props.tileset;
            return (
                <div id={this.props.id} className={this.props.classes} style={this.props.boardDimensions}>
                    {
                        tiles.map(function(tileText, position) {
                            return (
                                <Tile tileText={tileText} key={position} />
                            );
                        }, this)
                    }
                </div>
            );
            /* jshint ignore:end */
        }
    });

    // COMPONENT: Single Tile

    var Tile = React.createClass({
        getTileClassOf: function(tileText) {
            var tileClass = 'tile';

            if (!tileText) {
                return tileClass;
            }

            var fullClass = {
                'E': ' icon-space-ship',
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
                <div className={this.getTileClassOf(this.props.tileText)}></div>
                /* jshint ignore:end */
            );
        }
    });

    // COMPONENT: Player Tile

    var Player = React.createClass({
        getPosition: function() {
            var position = this.props.position;
            var tileWidth = 50;
            var translateX = position.x * tileWidth,
                translateY = position.y * tileWidth,
                translateZ = this.props.peeking ? '0' : '4px';
            var gridTranslate = 'translate3d(' + translateX + 'px, ' + translateY + 'px, ' + translateZ + ')';

            return {
                transform: gridTranslate,
                webkitTransform: gridTranslate
            };
        },
        render: function() {
            /* jshint ignore:start */
            var playerStyle = this.getPosition();
            return (
                <div ref="player" className={this.props.playerClass} id="player" style={playerStyle}></div>
            );
            /* jshint ignore:end */
        }
    });

    // COMPONENT: Hint

    var Hint = React.createClass({
        render: function() {
            /* jshint ignore:start */
            return (
                <div id="menu">
                    <p className="instruction">{this.props.status}</p>
                </div>
            );
            /* jshint ignore:end */
        }
    });

    // COMPONENT: Controls

    var Controls = React.createClass({
        handleClick: function(direction) {
            if (direction === 'up')         { direction = {x:  0, y: -1}; }
            else if (direction === 'down')  { direction = {x:  0, y:  1}; }
            else if (direction === 'left')  { direction = {x: -1, y:  0}; }
            else if (direction === 'right') { direction = {x:  1, y:  0}; }
            this.props.sendMove(direction);
        },
        render: function() {
            /* jshint ignore:start */
            return (
                <div className="controls">
                    <div className="arrow-keys">
                        <div className="arrow-keys-line">
                            <a className="icon-arrow-up clickable" onClick={this.handleClick.bind(this, 'up')} onTouchEnd={this.handleClick.bind(this, 'up')}></a>
                        </div>
                        <div className="arrow-keys-line">
                            <a className="icon-arrow-left clickable" onClick={this.handleClick.bind(this, 'left')} onTouchEnd={this.handleClick.bind(this, 'left')}></a>
                            <a className="icon-arrow-down clickable" onClick={this.handleClick.bind(this, 'down')} onTouchEnd={this.handleClick.bind(this, 'down')}></a>
                            <a className="icon-arrow-right clickable" onClick={this.handleClick.bind(this, 'right')} onTouchEnd={this.handleClick.bind(this, 'right')}></a>
                        </div>
                    </div>
                    <a className="spacebar clickable" onClick={this.props.sendPeek} onTouchEnd={this.props.sendPeek}></a>
                </div>
            );
            /* jshint ignore:end */
        }
    });

    React.renderComponent(
        Flip(null),
        document.getElementById('container')
    );

}(React, zoom));