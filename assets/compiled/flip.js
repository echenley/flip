/** @jsx React.DOM */

// Flip - A Game About Perspective
// ==============================
// Author:     Evan Henley
// Author URI: henleyedition.com

(function(React) {

    // COMPONENT: Game Board

    var Flip = React.createClass({displayName: 'Flip',

        rotate3d: function(axis) {
            var gameBoard = document.getElementById('game-board');
            var rotateX, rotateY, background, color;
            
            if (axis === 'x') {
                rotateX = !this.state.flipX ? '180deg' : '0';
                rotateY = this.state.flipY ? '180deg' : '0';
            } else {
                rotateX = this.state.flipX ? '180deg' : '0';
                rotateY = !this.state.flipY ? '180deg' : '0';
            }

            // exclusive or (XOR)
            if (this.state.flipX ? !this.state.flipY : this.state.flipY) {
                background = '#dcdeea';
                color = '#24283d';
            } else {
                background = '#24283d';
                color = '#dcdeea';
            }

            gameBoard.style.transform = 'rotateX(' + rotateX + ') rotateY(' + rotateY + ')';
            gameBoard.style.webkitTransform = 'rotateX(' + rotateX + ') rotateY(' + rotateY + ')';
            gameBoard.style.background = background;
            gameBoard.style.borderColor = color;
            gameBoard.style.color = color;
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

            // Check for win condition
            // must happen after flipX and flipY are set
            setTimeout(function () {
                this.setState({
                    win: this.checkBoard(playerPosition)
                });
            }.bind(this), 400);
        },
        move: function(direction) {

            var playerPosition = this.state.playerPosition,
                // invertX/Y used to invert direction when board is flipped
                invertY = this.state.flipX ? -1 : 1,
                invertX = this.state.flipY ? -1 : 1,
                newX = playerPosition.x + (direction.x * invertX),
                newY = playerPosition.y + (direction.y * invertY);

            // return if at the edge of board
            if (newX < 0 || newX > this.state.width-1 || newY < 0 || newY > this.state.height-1) {
                return;
            }

            var player = document.getElementById('player');
            var translateY = this.state.flipX ? (this.state.height - newY - 1) : newY;
            var translateX = this.state.flipY ? (this.state.width - newX - 1) : newX;

            // 25px = width of each tile
            var gridTranslate = 'translate3d(' + (translateX * 25) + 'px,' + (translateY * 25) + 'px,0)';

            player.style.transform = gridTranslate;
            player.style.webkitTransform = gridTranslate;

            // update playerPosition
            playerPosition.x = newX;
            playerPosition.y = newY;

            // Update Game State
            this.setState({
                playerPosition: playerPosition,
                win: this.checkBoard(playerPosition)
            });
        },
        checkBoard: function(playerPosition) {
            var goalPosition = this.state.goalPosition;
            // both or neither of flipX and flipY
            if (!(this.state.flipX ? !this.state.flipY : this.state.flipY) &&
                playerPosition.x === goalPosition.x &&
                playerPosition.y === goalPosition.y) {
                return true;
            }
            return false;
        },
        getOffset: function() {
            // Game Offset - used to offset player position
            var gameBoard = document.getElementById('game-board');
            // this accounts for gameBoard's border
            // parseInt removes 'px'
            var borderOffset = {
                top: parseInt(window.getComputedStyle(gameBoard).borderBottomWidth, 10),
                left: parseInt(window.getComputedStyle(gameBoard).borderLeftWidth, 10)
            };
            return {
                top: gameBoard.offsetTop + borderOffset.top,
                left: gameBoard.offsetLeft + borderOffset.left
            };
        },
        getDimensions: function() {
            return {
                width: 25 * this.state.width + 'px',
                height: 25 * this.state.height + 'px'
            };
        },
        blankBoard: function(x, y) {
            var board = [],
                goalPosition;

            function rowFill() {
                return '';
            }

            for (var i = 0; i < y; i++) {
                // generates an empty 2D array
                // http://www.2ality.com/2013/11/initializing-arrays.html
                var row = Array.apply(null, new Array(x));
                // fill with empty strings
                row = row.map(rowFill);
                board.push(row);
            }
            
            var goalPosition = {
                x: board[0].length-1,
                y: board.length-1
            };
            // this is your goal!
            board[goalPosition.y][goalPosition.x] = String.fromCharCode(9634);

            return {
                board: board,
                height: y,
                width: x,
                playerPosition: { x: 0, y: 0 },
                goalPosition: goalPosition
            };
        },
        restartGame: function() {
            var gameBoard = document.getElementById('game-board'),
                player = document.getElementById('player'),
                dimensions = this.getDimensions(),
                offset = this.getOffset();

            // clear style attributes
            player.style.transform = '';
            player.style.webkitTransform = '';
            document.getElementById('game-board').removeAttribute('style');

            // set game dimensions based on tiles
            gameBoard.style.width = dimensions.width;
            gameBoard.style.height = dimensions.height;

            // set the state!
            this.setState(this.getInitialState(offset));
        },
        handleKeyPress: function(e) {
            var key = e.keyCode;
            // don't do anything if already won
            if (this.state.win) { return; }
            if (key === 32) { this.flip('x'); }      // spacebar
            else if (key === 13) { this.flip('y'); } // enter
            else if (key === 37) { this.move({x: -1, y:  0}); } // left
            else if (key === 38) { this.move({x:  0, y: -1}); } // up
            else if (key === 39) { this.move({x:  1, y:  0}); } // right
            else if (key === 40) { this.move({x:  0, y:  1}); } // down
        },
        componentDidMount: function() {
            // Keyboard Events
            window.addEventListener('keydown', this.handleKeyPress);
            // run restart code
            this.restartGame();
        },
        getInitialState: function(offset) {
            var board = this.blankBoard(10, 10);
            offset = offset || { top: 0, left: 0 };
            return {
                // generate the game board
                height: board.height,
                width: board.width,
                offset: {
                    top: offset.top,
                    left: offset.left
                },
                // returns an array
                tiles: board.board,
                playerPosition: board.playerPosition,
                goalPosition: board.goalPosition,
                flipX: false,
                flipY: false,
                win: false
            };
        },
        render: function() {
            // flatten tiles array
            var tiles = this.state.tiles.reduce(function(a, b) {
                return a.concat(b);
            });
            return (
                React.DOM.div(null, 
                    React.DOM.div({id: "game-board", onKeyPress: this.handleKeyPress, style: this.getDimensions()}, 
                        
                            tiles.map(function(tile, position) {
                                return ( Tile({status: tile, key: position}) );
                            }, this)
                        
                    ), 
                    Player({boardOffset: this.state.offset, status: String.fromCharCode(9711)}), 
                    Menu({winClass: this.state.win ? 'button win' : 'button', status: this.state.win ? 'You win!' : 'Get to the exit.', restart: this.restartGame})
                )
            );
        }
    });

    // COMPONENT: Single Tile

    var Tile = React.createClass({displayName: 'Tile',
        render: function() {
            return (
                React.DOM.div({className: "tile"}, this.props.status)
            );
        }
    });

    // COMPONENT: Player Tile

    var Player = React.createClass({displayName: 'Player',
        render: function() {
            return (
                React.DOM.div({className: "tile", id: "player", style: this.props.boardOffset}, this.props.status)
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
                React.DOM.div({id: "menu"}, 
                    React.DOM.h3({id: "subtitle"}, this.props.status), 
                    React.DOM.a({className: this.props.winClass, onClick: this.clickHandler}, "Restart")
                )
            );
        }
    });

    React.renderComponent(
        Flip(null),
        document.getElementById('game-container')
    );

}(React));