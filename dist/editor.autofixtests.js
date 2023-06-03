const AutoFixTests = [
  {
    pre: '; Use this procedure to set up the coins\n; This procedure will create a single coin with the specified shape, color, and size\n; To create more coins, simply change the number in the "create-coins" command\n; To change the properties of the coins, modify the "set shape", "set color", and "set size" commands\n\nto setup-coins\n  ; Create a new breed called "coins"\n  breed [ coins coin ]\n  ; Use the "create-" command to create a single coin\n  create-coins\n  1 [\n    ; Set the shape of the coin\n    set shape "circle"\n    ; Set the color of the coin\n    set color red\n    ; Set the size of the coin\n    set size 1\n  ]\nend',
    post: '; Create a new breed called "coins"\nbreed [ coins coin ]\n; Use this procedure to set up the coins\n; This procedure will create a single coin with the specified shape, color, and size\n; To create more coins, simply change the number in the "create-coins" command\n; To change the properties of the coins, modify the "set shape", "set color", and "set size" commands\n\nto setup-coins\n  ; Use the "create-" command to create a single coin\n  create-coins 1 [\n    ; Set the shape of the coin\n    set shape "circle"\n    ; Set the color of the coin\n    set color red\n    ; Set the size of the coin\n    set size 1\n  ]\nend',
  },
  {
    pre: 'to create-turtles\n  ; Create 10 turtles using the breed name "turtles"\n  create-turtles\n\n  10 [\n    ; Set the turtle"s position to a random location\n    setxy random-xcor random-ycor\n  ] \nend',
    post: 'to setup-turtles\n  ; Create 10 turtles using the breed name "turtles"\n  create-turtles\n    10 [\n      ; Set the turtle"s position to a random location\n      setxy random-xcor random-ycor\n    ]\nend',
  },
  {
    pre: 'globals [ color something-else ]\nbreed [ trains train ]\ntrains-own [ size ]\nto create-trains\n  create-trains 100 [ set color red ]\nend',
    post: 'globals [ something-else ]\nbreed [ trains train ]\nto setup-trains\n  create-trains 100 [\n    set color red\n  ]\nend',
  },
  {
    pre: '; Create a breed called "rabbits"\nbreed [ rabbits rabbit ]\n\n; Use the "create-rabbits" command to create 100 rabbits\ncreate-rabbits\n  100 [\n    ; Set the location of each rabbit to a random location on the x and y axis\n    setxy random-xcor random-ycor ]',
    post: '; Create a breed called "rabbits"\nbreed [ rabbits rabbit ]\n\nto play\n  ; Use the "create-rabbits" command to create 100 rabbits\n  create-rabbits 100 [\n    ; Set the location of each rabbit to a random location on the x and y axis\n    setxy random-xcor random-ycor \n  ]\nend',
  },
];
