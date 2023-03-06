export const test_files: string[] = [
  `patches-own [
  chemical             ;; amount of chemical on this patch
  food                 ;; amount of food on this patch (0, 1, or 2)
  nest?                ;; true on nest patches, false elsewhere
  nest-scent           ;; number that is higher closer to the nest
  food-source-number   ;; number (1, 2, or 3) to identify the food sources
]

globals[ population diffusion-rate evaporation-rate ]

;;;;;;;;;;;;;;;;;;;;;;;;
;;; Setup procedures ;;;
;;;;;;;;;;;;;;;;;;;;;;;;

to setup
  clear-all
  set-default-shape turtles "bug"
  create-turtles population
  [ set size 2         ;; easier to see
    set color red  ]   ;; red = not carrying food
  setup-patches
  reset-ticks
end

to setup-patches
  ask patches
  [ setup-nest
    setup-food
    recolor-patch ]
end

to setup-nest  ;; patch procedure
  ;; set nest? variable to true inside the nest, false elsewhere
  set nest? (distancexy 0 0) < 5
  ;; spread a nest-scent over the whole world -- stronger near the nest
  set nest-scent 200 - distancexy 0 0
end

to setup-food  ;; patch procedure
  ;; setup food source one on the right
  if (distancexy (0.6 * max-pxcor) 0) < 5
  [ set food-source-number 1 ]
  ;; setup food source two on the lower-left
  if (distancexy (-0.6 * max-pxcor) (-0.6 * max-pycor)) < 5
  [ set food-source-number 2 ]
  ;; setup food source three on the upper-left
  if (distancexy (-0.8 * max-pxcor) (0.8 * max-pycor)) < 5
  [ set food-source-number 3 ]
  ;; set "food" at sources to either 1 or 2, randomly
  if food-source-number > 0
  [ set food one-of [1 2] ]
end

to recolor-patch  ;; patch procedure
  ;; give color to nest and food sources
  ifelse nest?
  [ set pcolor violet ]
  [ ifelse food > 0
    [ if food-source-number = 1 [ set pcolor cyan ]
      if food-source-number = 2 [ set pcolor sky  ]
      if food-source-number = 3 [ set pcolor blue ] ]
    ;; scale color to show chemical concentration
    [ set pcolor scale-color green chemical 0.1 5 ] ]
end

;;;;;;;;;;;;;;;;;;;;;
;;; Go procedures ;;;
;;;;;;;;;;;;;;;;;;;;;

to go  ;; forever button
  ask turtles
  [ if who >= ticks [ stop ] ;; delay initial departure
    ifelse color = red
    [ look-for-food  ]       ;; not carrying food? look for it
    [ return-to-nest ]       ;; carrying food? take it back to nest
    wiggle
    fd 1 ]
  diffuse chemical (diffusion-rate / 100)
  ask patches
  [ set chemical chemical * (100 - evaporation-rate) / 100  ;; slowly evaporate chemical
    recolor-patch ]
  tick
end

to return-to-nest  ;; turtle procedure
  ifelse nest?
  [ ;; drop food and head out again
    set color red
    rt 180 ]
  [ set chemical chemical + 60  ;; drop some chemical
    uphill-nest-scent ]         ;; head toward the greatest value of nest-scent
end

to look-for-food  ;; turtle procedure
  if food > 0
  [ set color orange + 1     ;; pick up food
    set food food - 1        ;; and reduce the food source
    rt 180                   ;; and turn around
    stop ]
  ;; go in the direction where the chemical smell is strongest
  if (chemical >= 0.05) and (chemical < 2)
  [ uphill-chemical ]
end

;; sniff left and right, and go where the strongest smell is
to uphill-chemical  ;; turtle procedure
  let scent-ahead chemical-scent-at-angle   0
  let scent-right chemical-scent-at-angle  45
  let scent-left  chemical-scent-at-angle -45
  if (scent-right > scent-ahead) or (scent-left > scent-ahead)
  [ ifelse scent-right > scent-left
    [ rt 45 ]
    [ lt 45 ] ]
end

;; sniff left and right, and go where the strongest smell is
to uphill-nest-scent  ;; turtle procedure
  let scent-ahead nest-scent-at-angle   0
  let scent-right nest-scent-at-angle  45
  let scent-left  nest-scent-at-angle -45
  if (scent-right > scent-ahead) or (scent-left > scent-ahead)
  [ ifelse scent-right > scent-left
    [ rt 45 ]
    [ lt 45 ] ]
end

to wiggle  ;; turtle procedure
  rt random 40
  lt random 40
  if not can-move? 1 [ rt 180 ]
end

to-report nest-scent-at-angle [angle]
  let p patch-right-and-ahead angle 1
  if p = nobody [ report 0 ]
  report [nest-scent] of p
end

to-report chemical-scent-at-angle [angle]
  let p patch-right-and-ahead angle 1
  if p = nobody [ report 0 ]
  report [chemical] of p
end


; Copyright 1997 Uri Wilensky.
; See Info tab for full copyright and license.`,
  `globals
[
  is-stopped?          ; flag to specify if the model is stopped
  blue-size
  blue-aggression
  blue-start-energy
  Add
  evaporation-rate
  red-size
  red-aggression
  red-start-energy
]

breed [flowers flower] ; the main food source
breed [nests nest]     ; the ants' home, where they bring food to and are born
breed [ants ant]       ; the red and blue ants
breed [queens queen]   ; the reproductive flying ants that found new colonies
breed [males male]     ; the queens' mates, required only for founding new colonies
breed [gasters gaster] ; part of the HUD display of ants
breed [boxes box]      ; the graphical element that holds the two HUD displayed ants in the top right and left of the model
breed [demos demo]     ; the other part of the HUD display



turtles-own
[
  age                  ; an ant's age
  team                 ; an ant's team
]

patches-own
[
  chemical             ; amount of chemical on this patch
  nest?                ; true on nest patches, false elsewhere
  my-color             ; determines an ant's team
  is-food?             ; whether a patch contains food
]

ants-own
[
  energy               ; each ant has energy, they die if energy is 0
  mother               ; stores the ant's mother nest
  has-food?            ; whether the ant is carrying food
  prey                 ; the target of the ant
  fighting?            ; whether this ant is currently in a fight
]


nests-own
[
  food-store            ; the total food stored inside the nest
  mother                ; stores the nest's mother nest
]

queens-own
[
  food-store            ; queens carry some food with them in fat on their body to found the new nest
]

;; setting up the model ;;
to startup  ; launches setup when the application starts
  setup
end

to setup    ; sets up two colonies in fixed locations in the world, each with 10 ants that belong to each nest
  clear-all
  initialize
  create-HUD-display-of-ants
  reset-ticks
end

to initialize ; sets up the colonies, initial flowers, grass, and gives each nest 10 ants
  set is-stopped? false
  ask patches
  [
    set nest?  false
    set is-food? false
    set my-color green - 1 set pcolor green - 1
  ]
  flowering 45 1 ; makes 45 flowers
  make-nest 1 -24 8  cyan "blue-team" ; place a blue colony
  make-nest 1 27 -7 red "red-team"      ; place a red colony
  ask nests [ hatched-ant 10 ]          ; give each colony 10 ants
  set-default-shape nests "anthill"
  ask turtles [ set age  1 ] ; keeps track of all turtles age
end
;; the model loop ;;
; Every time step ants move produce. Ants without food die, and nests without ants die.

to go                         ; repeats every time step, because the go button in the interface is set to forever.
  move-ants                   ; moves ants
  create-more-ants            ; produces more ants
  touch-input                 ; handles user touch inputs on view.
  paint-pheromone             ; recolors view from changes of pheromone level on each patch.
  flowering 1 500             ; grows more flowers for the ants to eat
  diffusion-pheromone         ; slowly evaporate pheromone trails
  death                       ; checks if ants die due to old age
  move-winged-ants            ; moves reproductive ants (queens and males), found a new colony if they run into each other.
  kill-empty-nest             ; removes nests with no ants left in them
  show-nest-food              ; places a label of food stored on nests
  go-into-nest                ; hides ants when they approach nests to simulate going inside
  control-heads-up-display-of-ants
  tick
end

;; movement procedures ;;
to move-ants ; moves ants
  ask ants
  [
    ifelse fighting? = false [ ; if the ant is not fighting
      any-body-here-to-fight? ; check if their is an ant to fight
      ifelse shape = "ant" ; if an ant
        ; and not carrying food? look for it
        [ look-for-food ]
        [ return-to-nest ] ; carrying food? take it back to nest
      wiggle ; performs a random walk to explore the map
      fd 1
    ]
    [
      blue-attack ; run attack for blue ants
      red-attack   ; run attack for red ants
      continue-fight  ; if in a fight, keep fighting
    ]
  ]
end


to move-winged-ants ; Moves winged ants. And if in an area they can found a colony, founds a colony.
  ask queens
  [
    wiggle
    fd 1
    ; makes nests in allowable areas: five patches from any other nest, and not under the black boxes in the top left and right.
    if not any? nests in-radius 5 and not any? boxes in-radius 10 [ found-colony ]
  ]
  ask males
  [
    wiggle
    fd 1
  ]
end


to return-to-nest  ; turtle procedure to return to the nest if the ant has found food

  ifelse nest?     ; if ant has food and is at their nest, drop off the food
  [
    set shape "ant"
    let delivery-point one-of nests in-radius 2

    if delivery-point != nobody
    [
      ask delivery-point [set food-store food-store + 1] ; drop food and head out again
      rt 180
      set has-food? false
    ]
  ]
  [
    set chemical chemical + 60  ; else, drop some chemical
     ; go back toward the location of the home nest with the possibility of stopping at another nest if it interrupts the path
    if mother != nobody [ face mother ]
  ]
end

to look-for-food ; turtle procedure
  if [is-food?] of patch-here = true
  [
    set energy energy + 1000    ; ant feeds herself
    rt 180                      ; and turns around to bring food back to the larva in the colony
    pickup-food-here
  ]

  ; move towards highest chemical load
  if (chemical >= 0.05) [ uphill-chemical ]
end

to pickup-food-here ; turtle procedure
  if has-food? = false
  [
    if shape = "ant" [ set shape "ant-has-food" ]
    let food-radius 2
    if any? flowers in-radius food-radius
    [
      ask one-of flowers in-radius food-radius
      [
        ; sets the shape of the flower to one less petal everytime an ant harvest it. The flower dies when it loses all of its pedals.
        (ifelse
          shape = "flower"  [ set shape "flower2" ]
          shape = "flower2" [ set shape "flower3" ]
          shape = "flower3" [ set shape "flower4" ]
          shape = "flower4" [ set shape "flower5" ]
          shape = "flower5" [ set shape "flower6" ]
          shape = "flower6" [ set shape "flower7" ]
          shape = "flower7" [ set shape "flower8" ]
          shape = "flower8" or shape = "flower-long8"
          [
            ask patch-here
            [
              set is-food? false
              ask neighbors [ set is-food? false ]
            ]
            die
          ]
        )
      ]
    ]
  ]
end

to wiggle  ; turtle procedure. randomly turns ants within a 80 degree arc in the direction the ant is heading
  rt random 40
  lt random 40
  if not can-move? 1 [ rt 180 ]
end

to found-colony   ; turtle procedure.
                  ; The males dies and the queen burrows into the ground and makes a nest.

  let mate one-of males in-radius 7  ;Makes new colonies of ants.

  if mate != nobody [
    if [breed] of mate = males
    [
      if [color] of mate != color ;  When a female meets a male of a different color,
      [
        hatch-nests 1   ; they mate.
        [
          set mother self ; sets the colony's ID to the hatched agent so that its workers can check belonging against the mother
          set color [color] of mate
          hatched-ant 4

          set size 20
          set shape "anthill"
          ask patch-here
          [
            set nest? true
            ask neighbors [ set nest? true ]
          ]
        ]
        ask mate [ die ]
        die
      ]
    ]
  ]
end

;; reproduction procedures;;
to create-more-ants ; births some ants
  ask nests
  [ ; for red colonies, if the stored food greater than the cost to feed a baby ant to adulthood, make another ant
    if color = red   [ if food-store > red-build-cost   [ birth ] ]
    ; for blue colonies, if the stored food greater than the cost to feed a baby ant to adulthood, make another ant
    if color = cyan [ if food-store > blue-build-cost [ birth ] ]
  ]
end

to produce-gynes [some-males some-females] ; produces reproduces males and females that fly about and found-new colonies.
  hatch-males some-males    [ set shape "butterfly" set size 5  set age 0 set label "" set age 0] ; creates some males
  hatch-queens some-females [ set shape "queens"    set size 10 set age 0 set label "" set age 0] ; creates some females
  set food-store food-store - 50 ; reduces the colony's food by  50. Wow that's a lot of food for just one ant!
end

to birth
  ifelse ticks mod 100 = 1 ; once in 100 ticks, reproduce, if there is enough food.
    [ produce-gynes 1 1 ]
    [ hatched-ant 1 ]

  if color = red   [ set food-store food-store - red-build-cost ]
  if color = cyan [ set food-store food-store - blue-build-cost ]
end

to hatched-ant [ some-ants ] ; turtle procedure. This procedure hatches some ants, called by nests.

  hatch-ants some-ants
  [
    ifelse color = red
      [ set energy red-start-energy]
      [ set energy blue-start-energy]
    set mother myself
    set fighting? false
    set shape "ant"
    set has-food? false
    ifelse color = red
      [ set size red-size ]
      [ set size blue-size ]
    set label ""
    set age 0
    set prey nobody
  ]
end

to make-nest [numb x y a-color a-team] ; Creates a nest at a location, of a team, and color.
  create-nests numb [
    setxy x y
    set size 20
    set shape "anthill"
    set nest? true
    set color a-color
    set team a-team
    ask neighbors [ set nest? true ]
    ask patch-here [ set plabel precision [food-store] of myself 1 ]

    set mother self ; a way to compare to their foragers to see if they are of the same nest (something real ants do with hydrocarbons on their skin)
  ]
end

;; death procedures ;;
to death ; check to see if turtles will die,
  ask ants
  [
    set energy energy - 5 + (1 - (blue-aggression / 100))
    if energy - (age) <= 0 [ die ]
  ]

  ask nests ; eats some of the stored food
  [
    set food-store food-store - 0.001
    if food-store < -100 [ die ]
  ]

  ; increment turtles age by 1 each time step
  ask turtles [ set age age + 1 ]
end

to kill-empty-nest ; If the ants of the new nest don't return food before they all die (fail to found) the colony dies

  ask nests
  [
    if not any? ants with [mother = [mother] of myself]
    [
      ask patch-here
      [
        set nest? false
        ask neighbors [ set nest? false ]
      ]

      ask patch-at 0 -7 [set plabel ""]
      die
    ]
  ]
end

;; following pheromone procedures ;;
to uphill-chemical  ; turtle procedure. sniff left and right, and go where the strongest smell is
  let scent-ahead chemical-scent-at-angle   0
  let scent-right chemical-scent-at-angle  45
  let scent-left  chemical-scent-at-angle -45
  if (scent-right > scent-ahead) or (scent-left > scent-ahead)
  [
    ifelse scent-right > scent-left
      [ rt 45 ]
      [ lt 45 ]
  ]
end

to-report chemical-scent-at-angle [angle] ; reports the amount of pheromone in a certain direction
  let p patch-right-and-ahead angle 1
  if p = nobody [ report 0 ]
  report [chemical] of p
end

to diffusion-pheromone ; adjusted the level of chemical each tick
  diffuse chemical (20 / 100)
  ask patches
  [
    set chemical chemical * (100 - (evaporation-rate )) / 100
    if chemical < 1 [ set chemical 0 ]
  ]
end

;; fight procedures;;
to any-body-here-to-fight? ; turtle procedure. Checks for other ants nearby of the other team, and makes sure the list isn't empty

  if any? other ants in-radius 1 with [team != [team] of myself] != nobody
  [ ; checks to make sure there are some other ants here
    ifelse any? other ants in-radius 1 with [team != [team] of myself]
      [ set fighting? true ] ; then fight them
      [ set fighting? false ]
  ]
end

to attack ; turtle procedure that checks if the ant it fighting, and the prey ant isn't of this ants colony, then  run away, and try to kill the ant, or stop fighting
  if prey != nobody
  [
    if fighting? = true
    [
      set prey one-of other ants-here with [team != [team] of myself]

      if prey != nobody
      [
        ask prey [ face myself ]

        if [breed] of prey = ants
        [
          if [team] of prey != team
          [
            let choice random 2
            ask prey
            [
              set chemical chemical + 60
              (ifelse
                choice = 0
                [
                  back 3 rt 90 ; backs off
                  set fighting? false
                  if random [size] of prey < random [size] of myself [die] ; and tries to kill the ant based on the size
                ]

                choice = 1 [set fighting? false] ; stop fighting
              )
            ]
          ]
        ]
      ]
    ]
  ]
end

to blue-attack ; turtle procedure calculates the blue aggression and if high enough to surpass a randomly generated number, the ant attacks this tick.
  ask ants with [team = "blue-team"] [ if blue-aggression > random 100 [ attack ] ]
end

to red-attack ; turtle procedure calculates the blue aggression and if high enough to surpass a randomly generated number, the ant attacks this tick.
  ask ants with [team = "red-team"]   [ if red-aggression > random 100 [ attack ] ]
end

to continue-fight ; handles what happens after each fight
  wiggle
  fd 1
  ask patch-here [set chemical chemical + 15]
  ifelse any? other ants in-radius 1 with [team != [team] of myself]
    [ face one-of other ants in-radius 1 ]
    [ set fighting? false ]
  if random 100 < 1 [ ask ants [ set fighting? false ] ]
end

;; flower procedures ;;
to flowering [some prob] ; adds some flowers to the view at some rate with prob likelihood.

  if random prob < 1
  [
    ask n-of some patches
    [
      sprout-flowers 1
      [
        set shape "flower"
        set size 16
        set color yellow
        ask patch-here
        [
          set is-food? true
          ask neighbors [ set is-food? true ]
        ]
      ]
    ]
  ]
end

;; Procedures for interfacing with touchscreen ;;

to touch-input; handles user touch input for chemicals, flowers, and vinegar
  if mouse-down?
  [
    ask patch mouse-xcor mouse-ycor
    [
    (ifelse
      add = "Chemical"
      [
        ask neighbors [set chemical chemical + 60  ]
      ]
      add = "Flower"
      [
        if not any? flowers in-radius 3  [sprout-flowers 1
          [
            set shape "flower"
            set color yellow
            set size 10
            set is-food? true
            ask neighbors [set is-food? true]
          ]
        ]
      ]
      add = "Vinegar"
      [
        set chemical 0 ask neighbors [set chemical 0  ]
      ]
    )
    ]
  ]
end

to paint-pheromone ; adds pheromone where the user touches the view
  ask patches
  [
    if chemical = 0 and pcolor = 55 or pcolor = 75  [set my-color pcolor]
    if chemical > 10 [set pcolor scale-color pink chemical -11 60]
    ifelse chemical > 2 [] [set pcolor my-color]
  ]
end

to-report blue-build-cost ; the amount the blue colonies need to reproduce one more ant, based on size, aggression and start energy
  let return 0
  set return blue-size / 2 + (blue-aggression / 15) + (blue-start-energy / 1000)
  report return
end

to-report red-build-cost ; the amount the red colonies need to reproduce one more ant, based on size, aggression and start energy
  let return 0
  set return red-size / 2 + (red-aggression / 15) + (red-start-energy / 1000)
  report return
end

to-report demo-shape-case ; set the size and face of the representation in the top left and right of view based on the teams size and aggression.
  let return "sideant"
  let choice red-aggression ; sets red as the default color

  if color = cyan + 2 [ set choice blue-aggression ] ; shifts the blue for the blue display.

  (ifelse  ; case switch statement for graphics that sets the shape in the top left and right based on the team's aggression level.
    choice < 10                  [ set return "sideant" ]
    choice > 10 and choice < 20  [ set return "sideant1" ]
    choice > 19 and choice < 30  [ set return "sideant2" ]
    choice > 29 and choice < 40  [ set return "sideant3" ]
    choice > 39 and choice < 50  [ set return "sideant4" ]
    choice > 49 and choice < 60  [ set return "sideant5" ]
    choice > 59 and choice < 70  [ set return "sideant6" ]
    choice > 69 and choice < 80  [ set return "sideant7" ]
    choice > 79 and choice < 90  [ set return "sideant8" ]
    choice > 89 and choice < 101 [ set return "sideant9" ]
  )
  report return
end

to control-heads-up-display-of-ants ; There are two grey squares that show the changing aggressiveness and size.
                                    ; Here we adjust the size of these to representations based on the size and aggresssion sliders
  ask demos [ifelse color = cyan + 2
    [
      set size blue-size * 2
      set shape demo-shape-case
    ]
    [
      set size red-size * 2
      set shape demo-shape-case
    ]
    ask flowers in-radius 10   ; doesn't allow flowers under the HUD
    [
      ask patch-here
      [
        set is-food? false
        ask neighbors [set is-food? false]
      ]
      die
    ]
  ]
  ask gasters
  [
    ifelse color = cyan
    [
      set size (blue-size * 2 + (blue-start-energy / 10))
    ]
    [
      set size (red-size * 2 + (red-start-energy / 10))
    ]
  ]

end

to  show-nest-food ; places a label on the colonies to show how much food they hold
  ask nests [if food-store >= 0 [ask patch-at 0 -7 [set plabel (word "Stored Food:" " " precision [food-store] of myself  0 )]]]
end

to go-into-nest ; simulate ants entering their nest by hiding them if they are bringing in food, and showing them once they drop it off.
  ask ants [ifelse any? nests in-radius 5 and has-food? = false [hide-turtle] [show-turtle]]
end

; creates the boxes in with ants in them in the upper right and left of the view. These changed based on how the players change their ant's characteristics.
to create-HUD-display-of-ants
  create-demos 2
  [
    set shape demo-shape-case
    set heading 0
    ifelse not any? demos with [color = cyan + 2]
    [
      setxy -63 21
      set size blue-size * 2
      set color cyan + 2
    ]
    [
      setxy 63 21
      set size red-size * 2
      set color red
    ]

    ask flowers in-radius 10
    [
      ask patch-here
      [
        set is-food? false
        ask neighbors [ set is-food? false ]
      ]
      die
    ]
    hatch-boxes 1
    [
      set shape "box2"
      set size 22
      set color grey
    ]
  ]
end


; Copyright 2019 Uri Wilensky.
; See Info tab for full copyright and license.`,
  `breed [ leaders leader ]
breed [ followers follower ]

globals [
  nest-x nest-y    ;; location of center of nest
  food-x food-y    ;; location of center of food
  num-ants
  leader-wiggle-angle
  start-delay
]

to setup
  clear-all
  set-default-shape turtles "bug"
  set nest-x 10 + min-pxcor                      ;; set up nest and food locations
  set nest-y 0
  set food-x max-pxcor - 10
  set food-y 0
  ;; draw the nest in brown by stamping a circular
  ;; brown turtle
  ask patch nest-x nest-y [
    sprout 1 [
      set color brown
      set shape "circle"
      set size 10
      stamp
      die
    ]
  ]
  ;; draw the food in orange by stamping a circular
  ;; orange turtle
  ask patch food-x food-y [
    sprout 1 [
      set color orange
      set shape "circle"
      set size 10
      stamp
      die
    ]
  ]
  create-leaders 1
    [ set color red ]                              ;; leader ant is red and start with a random heading
  create-followers (num-ants - 1)
    [ set color yellow                             ;; middle ants are yellow
      set heading 90 ]                             ;; and start with a fixed heading
  ask turtles
    [ setxy nest-x nest-y                          ;; start the ants out at the nest
      set size 2 ]
  ask turtle (max [who] of turtles)
    [ set color blue                               ;; last ant is blue
      set pen-size 2
      pen-down ]                                   ;; ...and leaves a trail
  ask leaders
    [ set pen-size 2
      pen-down ]                                   ;; the leader also leaves a trail
  reset-ticks
end

to go
  if all? turtles [xcor >= food-x]
    [ stop ]
   ask leaders                                      ;; the leader ant wiggles and moves
     [ wiggle leader-wiggle-angle
       correct-path
       if (xcor > (food-x - 5 ))                    ;; leader heads straight for food, if it is close
         [ facexy food-x food-y ]
       if xcor < food-x                             ;; do nothing if you're at or past the food
         [ fd 0.5 ] ]
   ask followers
     [ face turtle (who - 1)                        ;; follower ants follow the ant ahead of them
       if time-to-start? and (xcor < food-x)        ;; followers wait a bit before leaving nest
         [ fd 0.5 ] ]
  tick
end

;; turtle procedure; wiggle a random amount, averaging zero turn
to wiggle [angle]
  rt random-float angle
  lt random-float angle
end

;; turtle procedure
to correct-path
  ifelse heading > 180
    [ rt 180 ]
    [ if patch-at 0 -5 = nobody
        [ rt 100 ]
     if patch-at 0 5 = nobody
        [ lt 100 ] ]
end

;; turtle reporter; if true, then the ant is authorized to move out of the nest
to-report time-to-start?
  report ([xcor] of (turtle (who - 1))) > (nest-x + start-delay + random start-delay )
end


; Copyright 1997 Uri Wilensky.
; See Info tab for full copyright and license.`,
  `breed [ leaves leaf ]
breed [ dead-leaves dead-leaf ]
breed [ raindrops raindrop ]
breed [ suns sun ]

leaves-own [
  water-level       ;; amount of water in the leaf
  sugar-level       ;; amount of sugar in the leaf
  attachedness      ;; how attached the leaf is to the tree
  chlorophyll       ;; level of chemical making the leaf green
  carotene          ;; level of chemical making the leaf yellow
  anthocyanin       ;; level of chemical making the leaf red
]

raindrops-own [
  location          ;; either "falling", "in root", "in trunk", or "in leaves"
  amount-of-water
]

globals [
  bottom-line        ;; controls where the ground is
  evaporation-temp   ;; temperature at which water evaporates
  number-of-leaves
  start-sugar-mean
  start-sugar-stddev
  temperature
  rain-intensity
  wind-factor
  sun-intensity
  leaf-display-mode
]

;; ---------------------------------------
;; setup
;; ---------------------------------------

to setup
  clear-all
  set bottom-line min-pycor + 1
  set evaporation-temp 30
  set-default-shape raindrops "circle"
  set-default-shape suns "circle"

  ;; Create sky and grass
  ask patches [
    set pcolor blue - 2
  ]
  ask patches with [ pycor < min-pycor + 2 ] [
    set pcolor green
  ]

  ;; Create leaves
  create-leaves number-of-leaves [
    set chlorophyll 50 + random 50
    set water-level 75 + random 25
    ;; the sugar level is drawn from a normal distribution based on user inputs
    set sugar-level random-normal start-sugar-mean start-sugar-stddev
    set carotene random 100
    change-color
    set attachedness 100 + random 50
    ;; using sqrt in the next command makes the turtles be
    ;; evenly distributed; if we just said "fd random-float 10"
    ;; there'd be more turtles near the center of the tree,
    ;; which would look funny
    fd sqrt random-float 100
  ]

  ;; Create trunk and branches
  ask patches with [
    pxcor = 0 and pycor <= 5 or
    abs pxcor = (pycor + 2) and pycor < 4 or
    abs pxcor = (pycor + 8) and pycor < 3
  ] [
    set pcolor brown
  ]

  ;; Create the sun
  create-suns 1 [
    setxy (max-pxcor - 2) (max-pycor - 3)
    ;; change appearance based on intensity
    show-intensity
  ]

  ;; plot the initial state
  reset-ticks
end


;; ---------------------------------------
;; go
;; ---------------------------------------

to go
  ;; Stop if all of the leaves are dead
  if not any? leaves [ stop ]

  ;; Have the wind blow and rain fall;
  ;; move any water in the sky, on the ground, and in the tree;
  ;; set the appearance of the sun on the basis of its intensity.
  make-wind-blow
  make-rain-fall
  move-water
  ask suns [ show-intensity ]

  ;; Now our leaves respond accordingly
  ask attached-leaves [
    adjust-water
    adjust-chlorophyll
    adjust-sugar
    change-color
    change-shape
  ]

  ;; if the leaves are falling keep falling
  ask leaves [ fall-if-necessary ]

  ;; Leaves on the bottom should be killed off
  ask leaves with [ ycor <= bottom-line ] [
    set breed dead-leaves
  ]

  ;; Leaves without water should also be killed off
  ask leaves with [ water-level < 1 ] [
    set attachedness 0
  ]

  ;; Make sure that values remain between 0 - 100
  ask leaves [
    set chlorophyll (clip chlorophyll)
    set water-level (clip water-level)
    set sugar-level (clip sugar-level)
    set carotene (clip carotene)
    set anthocyanin (clip anthocyanin)
    set attachedness (clip attachedness)
  ]

  ;; increment the tick counter
  tick
end

to-report clip [ value ]
  if value < 0 [ report 0 ]
  if value > 100 [ report 100 ]
  report value
end

;; ---------------------------------------
;; make-wind-blow: When the wind blows,
;; the leaves move around a little bit
;; (for a nice visual effect), and
;; reduce their attachedness by the wind factor.
;; This means that leaves will fall off more
;; rapidly in stronger winds.
;; ---------------------------------------

to make-wind-blow
  ask leaves [
    ifelse random 2 = 1
      [ rt 10 * wind-factor ]
      [ lt 10 * wind-factor ]
    set attachedness attachedness - wind-factor
  ]
end


;; ---------------------------------------
;; make-rain-fall: rain is a separate breed
;; of small turtles that come from the top of the world.
;; ---------------------------------------

to make-rain-fall
  ;; Create new raindrops at the top of the world
  create-raindrops rain-intensity [
    setxy random-xcor max-pycor
    set heading 180
    fd 0.5 - random-float 1.0
    set size .3
    set color gray
    set location "falling"
    set amount-of-water 10
  ]
  ;; Now move all the raindrops, including
  ;; the ones we just created.
  ask raindrops [ fd random-float 2 ]
end


;; --------------------------------------------------------
;; move-water: water goes from raindrops -> ground,
;; ground -> trunk/branches, and trunk/branches to leaves.
;; --------------------------------------------------------

to move-water

  ;; We assume that the roots extend under the entire grassy area; rain flows through
  ;; the roots to the trunk
  ask raindrops with [ location = "falling" and pcolor = green ] [
    set location "in roots"
    face patch 0 ycor
  ]

  ;; Water flows from the trunk up to the central part of the tree.
  ask raindrops with [ location = "in roots" and pcolor = brown ] [
    face patch 0 0
    set location "in trunk"
  ]

  ;; Water flows out from the trunk to the leaves.  We're not going to
  ;; simulate branches here in a serious way
  ask raindrops with [ location = "in trunk" and patch-here = patch 0 0 ] [
    set location "in leaves"
    set heading random 360
  ]

  ;; if the raindrop is in the leaves and there is nothing left disappear
  ask raindrops with [ location = "in leaves" and amount-of-water <= 0.5 ] [
    die
  ]

  ;; if the raindrops are in the trunk or leaves and they are at a place
  ;; where they can no longer flow into a leaf then disappear
  ask raindrops with [
    (location = "in trunk" or location = "in leaves")
    and (ycor > max [ ycor ] of leaves or
         xcor > max [ xcor ] of leaves or
         xcor < min [ xcor ] of leaves)
  ] [
    die
  ]

end

;;---------------------------------------------------------
;; Turtle Procedures
;; --------------------------------------------------------

;; --------------------------------------------------------
;; show-intensity: Change how the sun looks to indicate
;; intensity of sunshine.
;; --------------------------------------------------------

to show-intensity  ;; sun procedure
  set color scale-color yellow sun-intensity 0 150
  set size sun-intensity / 10
  set label word sun-intensity "%"
  ifelse sun-intensity < 50
    [ set label-color yellow ]
    [ set label-color black  ]
end

;; --------------------------------------------------------
;; adjust-water: Handle the ups and downs of water within the leaf
;; --------------------------------------------------------

to adjust-water
  ;; Below a certain temperature, the leaf does not absorb
  ;; water any more.  Instead, it converts sugar and and water
  ;; to anthocyanin, in a proportion
  if temperature < 10 [ stop ]

  ;; If there is a raindrop near this leaf with some water
  ;; left in it, then absorb some of that water
  let nearby-raindrops raindrops in-radius 2 with [ location = "in leaves" and amount-of-water >= 0 ]

  if any? nearby-raindrops [
    let my-raindrop min-one-of nearby-raindrops [ distance myself ]
    set water-level water-level + ([ amount-of-water ] of my-raindrop * 0.20)
    ask my-raindrop [
      set amount-of-water (amount-of-water * 0.80)
    ]
  ]

  ;; Reduce the water according to the temperature
  if temperature > evaporation-temp [
    set water-level water-level - (0.5 * (temperature - evaporation-temp))
  ]

  ;; If the water level goes too low, reduce the attachedness
  if water-level < 25 [
    set attachedness attachedness - 1
  ]

end


;; ---------------------------------------
;; adjust-chlorophyll: It's not easy being green.
;; Chlorophyll gets reduces when the temperature is
;; low, or when the sun is strong.  It increases when
;; the temperature is normal and the sun is shining.
;; ---------------------------------------

to adjust-chlorophyll

  ;; If the temperature is low, then reduce the chlorophyll
  if temperature < 15 [
    set chlorophyll chlorophyll - (.5 * (15 - temperature))
  ]

  ;; If the sun is strong, then reduce the chlorophyll
  if sun-intensity > 75 [
    set chlorophyll chlorophyll - (.5 * (sun-intensity - 75))
  ]

  ;; New chlorophyll comes from water and sunlight
  if temperature > 15 and sun-intensity > 20 [
    set chlorophyll chlorophyll + 1
  ]

end


;; ---------------------------------------
;; adjust-sugar: water + sunlight + chlorophyll = sugar
;; ---------------------------------------

to adjust-sugar
  ;; If there is enough water and sunlight, reduce the chlorophyll
  ;; and water, and increase the sugar
  if water-level > 1 and sun-intensity > 20 and chlorophyll > 1 [
    set water-level water-level - 0.5
    set chlorophyll chlorophyll - 0.5
    set sugar-level sugar-level + 1
    set attachedness attachedness + 5
  ]

  ;; Every tick of the clock, we reduce the sugar by 1
  set sugar-level sugar-level - 0.5
end

;; ---------------------------------------
;; fall-if-necessary:  If a leaf is above the bottom row, make it fall down
;; If it hits the bottom line, make it a dead-leaf
;; ---------------------------------------

to fall-if-necessary
  if attachedness > 0 [ stop ]
  if ycor > bottom-line [
    let target-xcor (xcor + random-float wind-factor - random-float wind-factor)
    facexy target-xcor bottom-line
    fd random-float (.7 * max (list wind-factor .5))
  ]
end


;; ---------------------------------------
;; change-color: Because NetLogo has a limited color scheme,
;; we need very simple rules
;; ---------------------------------------

to change-color
  ;; If the temperature is low, then we turn the
  ;; sugar into anthocyanin
  if temperature < 20 and sugar-level > 0 and water-level > 0 [
    set sugar-level sugar-level - 1
    set water-level water-level - 1
    set anthocyanin anthocyanin + 1
  ]

  ;; If we have more than 50 percent chlorophyll, then
  ;; we are green, and scale the color accordingly
  ifelse chlorophyll > 50 [
    set color scale-color green chlorophyll 150 -50
  ] [
    ;; If we are lower than 50 percent chlorophyll, then
    ;; we have yellow (according to the carotene), red (according
    ;; to the anthocyanin), or orange (if they are about equal).

    ;; If we have roughly equal anthocyanin and carotene,
    ;; then the leaves should be in orange.
    if abs (anthocyanin - carotene ) < 10 [
      set color scale-color orange carotene 150 -50
    ]
    if anthocyanin > carotene + 10 [
      set color scale-color red anthocyanin 170 -50
    ]
    if carotene > anthocyanin + 10 [
      set color scale-color yellow carotene 150 -50
    ]
  ]
end

to change-shape
  ifelse leaf-display-mode = "solid" [
    set shape "default"
  ] [
    if leaf-display-mode = "chlorophyll" [
      set-shape-for-value chlorophyll
    ]
    if leaf-display-mode = "water" [
      set-shape-for-value water-level
    ]
    if leaf-display-mode = "sugar" [
      set-shape-for-value sugar-level
    ]
    if leaf-display-mode = "carotene" [
      set-shape-for-value carotene
    ]
    if leaf-display-mode = "anthocyanin" [
      set-shape-for-value anthocyanin
    ]
    if leaf-display-mode = "attachedness" [
      set-shape-for-value attachedness
    ]
  ]
end

;; returns all leaves still attached
to-report attached-leaves
  report leaves with [attachedness > 0]
end

;; makes the leaf appear to be more or less filled depending on value
to set-shape-for-value [ value ]
  ifelse value > 75 [
    set shape "default"
  ] [
    ifelse value <= 25 [
      set shape "default one-quarter"
    ] [
      ifelse value <= 50 [
        set shape "default half"
      ] [
        set shape "default three-quarter"
      ]
    ]
  ]
end


; Copyright 2005 Uri Wilensky.
; See Info tab for full copyright and license.`,
  `breed [ sites site ]
breed [ scouts scout ]

sites-own [
  quality discovered?
  scouts-on-site
]
scouts-own [

  my-home          ; a bee's original position
  next-task        ; the code block a bee is running
  task-string      ; the behavior a bee is displaying
  bee-timer        ; a timer keeping track of the length of the current state
                   ;   or the waiting time before entering next state
  target           ; the hive that a bee is currently focusing on exploring
  interest         ; a bee's interest in the target hive
  trips            ; times a bee has visited the target

  initial-scout?   ; true if it is an initial scout, who explores the unknown horizons
  no-discovery?    ; true if it is an initial scout and fails to discover any hive site
                   ;   on its initial exploration
  on-site?         ; true if it's inspecting a hive site
  piping?          ; a bee starts to "pipe" when the decision of the best hive is made.
                   ;   true if a be observes more bees on a certain hive site than the
                   ;   quorum or when it observes other bees piping

  ; dance related variables:

  dist-to-hive     ; the distance between the swarm and the hive that a bee is exploring
  circle-switch    ; when making a waggle dance, a bee alternates left and right to make
                   ;   the figure "8". circle-switch alternates between 1 and -1 to tell
                   ;   a bee which direction to turn.
  temp-x-dance     ; initial position of a dance
  temp-y-dance
]

globals [
  color-list       ; colors for hives, which keeps consistency among the hive colors, plot
                   ;   pens colors, and committed bees' colors
  quality-list     ; quality of hives

  ; visualization:

  show-dance-path? ; dance path is the circular patter with a zigzag line in the middle.
                   ;   when large amount of bees dance, the patterns overlaps each other,
                   ;   which makes them hard to distinguish. turn show-dance-path? off can
                   ;   clear existing patterns
  scouts-visible?  ; you can hide scouts and only look at the dance patterns to avoid
                   ;   distraction from bees' dancing movements
  watch-dance-task ; a list of tasks
  discover-task
  inspect-hive-task
  go-home-task
  dance-task
  re-visit-task
  pipe-task
  take-off-task
  hive-number
  initial-percentage 
  initial-explore-time 
  quorum
]

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;setup;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
to setup
  clear-all
  setup-hives
  setup-tasks
  setup-bees
  set show-dance-path? true
  set scouts-visible? true
  reset-ticks
end

to setup-hives
  set color-list [ 97.9 94.5 57.5 63.8 17.6 14.9 27.5 25.1 117.9 114.4 ]
  set quality-list [ 100 75 50 1 54 48 40 32 24 16 ]
  ask n-of hive-number patches with [
    distancexy 0 0 > 16 and abs pxcor < (max-pxcor - 2) and
    abs pycor < (max-pycor - 2)
  ] [
    ; randomly placing hives around the center in the
    ; view with a minimum distance of 16 from the center
    sprout-sites 1 [
      set shape "box"
      set size 2
      set color gray
      set discovered? false
    ]
  ]
  let i 0 ; assign quality and plot pens to each hive
  repeat count sites [
    ask site i [
      set quality item i quality-list
      set label quality
    ]
    set-current-plot "on-site"
    create-temporary-plot-pen word "site" i
    set-plot-pen-color item i color-list
    set-current-plot "committed"
    create-temporary-plot-pen word "target" i
    set-plot-pen-color item i color-list
    set i i + 1
  ]
end

to setup-bees
  create-scouts 100 [
    fd random-float 4 ; let bees spread out from the center
    set my-home patch-here
    set shape "bee"
    set color gray
    set initial-scout? false
    set target nobody
    set circle-switch 1
    set no-discovery? false
    set on-site? false
    set piping? false
    set next-task watch-dance-task
    set task-string "watching-dance"
  ]
  ; assigning some of the scouts to be initial scouts.
  ; bee-timer here determines how long they will wait
  ; before starting initial exploration
  ask n-of (initial-percentage) scouts [
    set initial-scout? true
    set bee-timer random 100
  ]
end


to setup-tasks
  watch-dance
  discover
  inspect-hive
  go-home
  dance
  re-visit
  pipe
  take-off
end

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;watch-dance;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
to watch-dance
  set watch-dance-task [ ->
    if count scouts with [piping?] in-radius 3 > 0 [
      ; if detecting any piping scouts in the swarm, pipe too
      set target [target] of one-of scouts with [piping?]
      set color [color] of target
      set next-task pipe-task
      set task-string "piping"
      set bee-timer 20
      set piping? true
    ]
    move-around
    if initial-scout? and bee-timer < 0 [
      ; a initial scout, after the waiting period,
      ; takes off to discover new hives.
      ; it has limited time to do the initial exploration,
      ; as specified by initial-explore-time.
      set next-task discover-task
      set task-string "discovering"
      set bee-timer initial-explore-time
      set initial-scout? false
    ]
    if not initial-scout? [
      ; if a bee is not a initial scout (either born not to be
      ; or lost its initial scout status due to the failure of
      ; discovery in its initial exploration), it watches other
      ; bees in its cone of vision
      if bee-timer < 0 [
        ; idle bees have bee-timer less than 0, usually as the
        ; result of reducing bee-timer from executing other tasks,
        ; such as dance
        if count other scouts in-cone 3 60 > 0 [
          let observed one-of scouts in-cone 3 60
          if [ next-task ] of observed = dance-task [
            ; randomly pick one dancing bee in its cone of vision
            ; random x < 1 means a chance of 1 / x. in this case,
            ; x = ((1 / [interest] of observed) * 1000), which is
            ; a function to correlate interest, i.e. the enthusiasm
            ; of a dance, with its probability of being followed:
            ; the higher the interest, the smaller 1 / interest,
            ; hence the smaller x, and larger 1 / x, which means
            ; a higher probability of being seen.
            if random ((1 / [interest] of observed) * 1000) < 1 [
              ; follow the dance
              set target [target] of observed
              ; use white to a bee's state of having in mind
              ; a target  without having visited it yet
              set color white
              set next-task re-visit-task
              ; re-visit could be an initial scout's subsequent
              ; visits of a hive after it discovered the hive,
              ; or it could be a non-initial scout's first visit
              ; and subsequent visits to a hive (because non-scouts
              ; don't make initial visit, which is defined as the
              ; discovering visit).
              set task-string "revisiting"
            ]
          ]
        ]
      ]
    ]
    ; reduce bees' waiting time by 1 tick
    set bee-timer bee-timer - 1
  ]
end


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;discover;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
to discover
  set discover-task [ ->
    ifelse bee-timer < 0 [
      ; if run out of time (a bee has limited time to make initial
      ; discovery), go home, and admit no discovery was made
      set next-task go-home-task
      set task-string "going-home"
      set no-discovery? true
    ] [
      ; if a bee finds sites around it (within a distance of 3) on its way
      ifelse count sites in-radius 3 > 0 [
        ; then randomly choose one to focus on
        let temp-target one-of sites in-radius 3
        ; if this one hive was not discovered by other bees previously
        ifelse not [discovered?] of temp-target [
          ; commit to this hive
          set target temp-target
          ask target [
            ; make the target as discovered
            set discovered? true
            set color item who color-list
          ]
          ; collect info about the target
          set interest [ quality ] of target
          ; the bee changes its color to show its commitment to this hive
          set color [ color ] of target
          set next-task inspect-hive-task
          set task-string "inspecting-hive"
          ; will inspect the target for 100 ticks
          set bee-timer 100
        ] [
          ; if no hive site is around, keep going forward
          ; with a random heading between [-60, 60] degrees
          rt (random 60 - random 60) proceed
          set bee-timer bee-timer - 1
        ]
      ] [
        rt (random 60 - random 60) proceed
      ]
      set bee-timer bee-timer - 1
    ]
  ]
end

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;inspect-hive;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
to inspect-hive
  set inspect-hive-task [ ->
    ; after spending certain time (as specified in bee-timer, see the
    ; last comment of this task) on inspecting hives, they fly home.
    ifelse bee-timer < 0 [
      set next-task go-home-task
      set task-string "going-home"
      set on-site? false
      set trips trips + 1
    ] [
      ; while on inspect-hive task,
      if distance target > 2 [
        face target fd 1 ; a bee flies to its target hive
      ]
      set on-site? true
      ; if it counts more bees than what the quorum specifies, it starts to pipe.
      let nearby-scouts scouts with [ on-site? and target = [ target ] of myself ] in-radius 3
      if count nearby-scouts > quorum [
        set next-task go-home-task
        set task-string "going-home"
        set on-site? false
        set piping? true
      ]
      ; this line makes the visual effect of a bee showing up and disappearing,
      ; representing the bee checks both outside and inside of the hive
      ifelse random 3 = 0 [ hide-turtle ] [ show-turtle ]
      ; a bee knows how far this hive is from its swarm
      set dist-to-hive distancexy 0 0
      ; the bee-timer keeps track of how long the bee has been inspecting
      ; the hive. It lapses as the model ticks. it is set in either the
      ; discover task (100 ticks) or the re-visit task (50 ticks).
      set bee-timer bee-timer - 1
    ]
  ]
end

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;go-home;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
to go-home
  set go-home-task [ ->
    ifelse distance my-home < 1 [ ; if back at home
      ifelse no-discovery? [
        ; if the bee is an initial scout that failed to discover a hive site
        set next-task watch-dance-task
        set task-string "watching-dance"
        set no-discovery? false
        ; it loses its initial scout status and becomes a
        ; non-scout, who watches other bees' dances
        set initial-scout? false
      ] [
        ifelse piping? [
          ; if the bee saw enough bees on the target site,
          ; it prepares to pipe for 20 ticks
          set next-task pipe-task
          set task-string "piping"
          set bee-timer 20
        ] [
          ; if it didn't see enough bees on the target site,
          ; it prepares to dance to advocate it. it resets
          ; the bee-timer to 0 for the dance task
          set next-task dance-task
          set task-string "dancing"
          set bee-timer 0
        ]
      ]
    ] [
      face my-home proceed
    ]
  ]
end

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;dance;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; bees dance multiple rounds for a good site. After visiting the site for the first
; time, they return to the swarm and make a long dance for it enthusiastically, and
; then go back to visit the site again. When they return, they would dance for it
; for another round, with slightly declined length and enthusiasm. such cycle repeats
; until the enthusiasm is completely gone. in the code below, interest represents
; a bee's enthusiasm and the length of the dance. trips keep track of how many times
; the bee has visited the target. after each revisiting trip, the interest declines
; by [15, 19], as represented by (15 + random 5).
; interest - (trips - 1) * (15 + random 5) determines how long a bee will dance after
; each trip. e.g. when a hive is first discovered (trips = 1), if the hive quality is
; 100, i.e. the bee's initial interest in this hive is 100, it would dance
; 100 - (1 - 1) * (15 + random 5) = 100. However, after 100 ticks of dance, the bee's
; interest in this hive would reduce to [85,81].
; Assuming it declined to 85, when the bee dances for the hive a second time, it
; would only dance between 60 to 70 ticks: 85 - (2 - 1) * (15 + random 5) = [70, 66]
to dance
  set dance-task [ ->
    ifelse count scouts with [piping?] in-radius 3 > 0 [
      ; while dancing, if detecting any piping bee, start piping too
      pen-up
      set next-task pipe-task
      set task-string "piping"
      set bee-timer 20
      set target [target] of one-of scouts with [piping?]
      set color [color] of target
      set piping? true
    ] [
      if bee-timer > interest - (trips - 1) * (15 + random 5) and interest > 0 [
        ; if a bee dances longer than its current interest, and if it's still
        ; interested in the target, go to revisit the target again
        set next-task re-visit-task
        set task-string "revisiting"
        pen-up
        set interest interest - (15 + random 5) ; interest decline by [15,19]
        set bee-timer 25                        ; revisit 25 ticks
      ]
      if bee-timer > interest - (trips - 1) * (15 + random 5) and interest <= 0 [
        ; if a bee dances longer than its current interest, and if it's no longer
        ; interested in the target, as represented by interest <=0, stay in the
        ; swarm, rest for 50 ticks, and then watch dance
        set next-task watch-dance-task
        set task-string "watching-dance"
        set target nobody
        set interest 0
        set trips 0
        set color gray
        set bee-timer 50
      ]
      if bee-timer <=  interest - (trips - 1) * (15 + random 5) [
        ; if a bee dances short than its current interest, keep dancing
        ifelse interest <= 50 and random 100 < 43 [
          set next-task re-visit-task
          set task-string "revisiting"
          set interest interest - (15 + random 5)
          set bee-timer 10
        ] [
          ifelse show-dance-path? [pen-down][pen-up]
          repeat 2 [
            waggle
            make-semicircle]
        ]
      ]
      set bee-timer bee-timer + 1
    ]
  ]
end

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;re-visit;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
to re-visit
  set re-visit-task [ ->
    ifelse bee-timer > 0 [
      ; wait a bit after the previous trip
      set bee-timer bee-timer - 1
    ] [
      pen-up
      ifelse distance target < 1 [
        ; if on target, learn about the target
        if interest = 0 [
          set interest [ quality ] of target
          set color [ color ] of target
        ]
        set next-task inspect-hive-task
        set task-string "inspecting-hive"
        set bee-timer 50
      ] [
        ; if hasn't reached target yet (distance > 1), keep flying
        proceed
        face target
      ]
    ]
  ]
end

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;pipe;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
to pipe
  set pipe-task [ ->
    move-around
    if count scouts with [ piping? ] in-radius 5 = count scouts in-radius 5 [
      ; if every surrounding bee is piping, wait a bit (20 ticks as
      ; set in the watch-dance procedure) for bees to come back to
      ; the swarm from the hive before taking off
      set bee-timer bee-timer - 1
    ]
    if bee-timer < 0 [
      set next-task take-off-task
      set task-string "taking-off"
    ]
  ]
end

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;take-off;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
to take-off
  set take-off-task [ ->
    ifelse distance target > 1 [
      face target fd 1
    ] [
      set on-site? true
    ]
  ]
end

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;run-time;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
to go
  if all? scouts [ on-site? ] and length remove-duplicates [ target ] of scouts = 1 [
  ; if all scouts are on site, and they all have the same target hive, stop.
    stop
  ]
  ask scouts [ run next-task ]
  plot-on-site-scouts
  tick
end

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;utilities;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
to make-semicircle
  ; calculate the size of the semicircle. 2600 and 5 (in pi / 5) are numbers
  ; selected by trial and error to make the dance path look good
  let num-of-turns 1 / interest * 2600
  let angle-per-turn 180 / num-of-turns
  let semicircle 0.5 * dist-to-hive * pi / 5
  if circle-switch = 1 [
    face target lt 90
    repeat num-of-turns [
      lt angle-per-turn
      fd (semicircle / 180 * angle-per-turn)
    ]
  ]
  if circle-switch = -1 [
    face target rt 90
    repeat num-of-turns [
      rt angle-per-turn
      fd (semicircle / 180 * angle-per-turn)
    ]
  ]

  set circle-switch circle-switch * -1
  setxy temp-x-dance temp-y-dance
end

to waggle
  ; pointing the zigzag direction to the target
  face target
  set temp-x-dance xcor set temp-y-dance ycor
  ; switch toggles between 1 and -1, which makes a bee
  ; dance a zigzag line by turning left and right
  let waggle-switch 1
  ; first part of a zigzag line
  lt 60
  fd .4
  ; correlates the number of turns in the zigzag line with the distance
  ; between the swarm and the hive. the number 2 is selected by trial
  ; and error to make the dance path look good
  repeat (dist-to-hive - 2) / 2 [
    ; alternates left and right along the diameter line that points to the target
    if waggle-switch = 1 [rt 120 fd .8]
    if waggle-switch = -1 [lt 120 fd .8]
    set waggle-switch waggle-switch * -1
  ]
  ; finish the last part of the zigzag line
  ifelse waggle-switch = -1 [lt 120 fd .4][rt 120 fd .4]
end

to proceed
  rt (random 20 - random 20)
  if not can-move? 1 [ rt 180 ]
  fd 1
end

to move-around
  rt (random 60 - random 60) fd random-float .1
  if distancexy 0 0 > 4 [facexy 0 0 fd 1]
end

to plot-on-site-scouts
  let i 0
  repeat count sites [
    set-current-plot "on-site"
    set-current-plot-pen word "site" i
    plot count scouts with [on-site? and target = site i]

    set-current-plot "committed"
    set-current-plot-pen word "target" i
    plot count scouts with [target = site i]

    set i i + 1
  ]
end

to show-hide-dance-path
  if show-dance-path? [
    clear-drawing
  ]
  set show-dance-path? not show-dance-path?
end

to show-hide-scouts
  ifelse scouts-visible? [
    ask scouts [hide-turtle]
  ]
  [
    ask scouts [show-turtle]
  ]
  set scouts-visible? not scouts-visible?
end


; Copyright 2014 Uri Wilensky.
; See Info tab for full copyright and license.`,
  `; All initialization / setup values are derived from real-world figures.
; I arrived at these values using estimates of resting blood sugar levels
; (80 mg/dL), post-meal blood sugar levels (120 mg/dL), human blood volume
; (5L), daily caloric intake (2000 kcal), average nutrient absorption period
; after a meal (2 hours), and starvation time (3 weeks).  Starting with the
; observations that the model's resting blood sugar level is about 4000 and
; adding glucoses at about 400 per tick raises the stable blood sugar by
; about 1.5 times, it is possible to derive the correspondence between
; glucose particles and mg glucose as well as reasonable meal sizes, the
; correspondence between ticks and seconds, meal lengths, metabolic rates,
; and initial glucose reserves. However, this ideal correspondence results
; in an enormous initial glucose store (10.5 million) and time to starvation
; in the model (105k ticks), so I have scaled the glucose energy density
; correspondence by about 1/25. This means that one tick represents about
; 7 minutes, and one glucose represents about 25 mg of real glucose,
; equivalent to 0.1 kcal. This is a fairly high grain size for both time and
; energy.  This also means that the blood sugar levels in the model are
; unusually high if scaled up to a real person, but most other times,
; relationships, and rates correspond properly to the real world within an
; order of magnitude. Most of the inaccuracies help to mitigate the negative
; effects of the high grain size noted earlier. I also accelerated starvation
; for ease of observation by reducing the initial store of glucose.

globals [
  molecule-size     ; display scaling constant
  hormone-half-life
  hormone-mean-life
  eating?           ; keep track of meal state based on EAT button presses
  eat-time          ; keep track of ongoing meal duration
  total-glucose     ; storage variable to record combined blood and stored glucose
  glucose-baseline  ; average 'normal' number of glucoses in the blood per cell
  meal-size
  meal-length
  metabolic-rate 
  glucose-sensitivity
  insulin-sensitivity 
  glucagon-sensitivity 
]

; Set up different cell breeds.
; We need different cell types to behave differently.
; This is why cells are turtles rather than patches.
breed [ liver-cells liver-cell ]
breed [ pancreatic-cells pancreatic-cell ]

; Set up different molecule breeds
breed [ glucoses glucose ]
breed [ insulins insulin ]
breed [ glucagons glucagon ]

liver-cells-own [ glucose-store ]
insulins-own [ lifetime ]
glucagons-own [ lifetime ]

to setup
  clear-all

  set-default-shape turtles "circle outline"
  set molecule-size 0.25
  set eat-time 0
  set eating? false

  ; These values are calibrated to establish a reasonable correspondence for
  ; energy density and time between the model and the real world system.
  ; See the comment at the top of the file for more information.
  set glucose-baseline 3 ; Controls the normal blood glucose level.
  set hormone-half-life 2 ; Corresponds to 14 minutes, roughly twice insulin.
  set hormone-mean-life hormone-half-life / ln 2 ; From exponential distribution.
  set meal-size 7000 ; Corresponds to about 1/3 of daily caloric intake.
  set meal-length 17 ; Nutrient absorption period. Corresponds to about 2 hours.

  ; Set up organs
  make-liver
  make-pancreas

  let world-area (2 * max-pxcor + 1) * (2 * max-pycor + 1)

  ; Make initial molecules at approximately their stable concentrations.
  create-glucoses world-area * (glucose-baseline + 1) [
    random-position
    set color white
    set size molecule-size
  ]
  ; Hormones typically follow exponential decay, so their lifetimes
  ; are randomly drawn from an exponential distribution. This also
  ; makes the least assumptions, since the exponential distribution
  ; is the maximum-entropy distribution for a fixed, positive mean.
  create-insulins round (world-area / 3) [
    random-position
    set color sky
    set size molecule-size * 2
    set lifetime random-exponential hormone-mean-life
  ]
  create-glucagons round (world-area / 3) [
    random-position
    set color red
    set size molecule-size * 2
    set lifetime random-exponential hormone-mean-life
  ]

  ; keep track of the body's fuel
  set total-glucose (count glucoses) + sum ([glucose-store] of liver-cells)

  reset-ticks
end

to go
  if (total-glucose = 0) [
    user-message "The body ran out of glucose."
    stop
  ]

  ; Keeps track of the EAT button presses
  if eating? [ add-glucose ]

  ; Liver detects hormones and absorbs / releases glucose
  ask liver-cells [ adjust-glucose ]

  ; Pancreas detects glucose and maybe releases insulin / glucagon
  ask pancreatic-cells [ adjust-hormones ]

  metabolize-glucose
  signal-degradation

  ; Ask signals to move
  ask insulins [ move ]
  ask glucagons [ move ]
  ask glucoses [ move ]

  ; Keep track of the body's fuel
  set total-glucose (count glucoses) + sum ([glucose-store] of liver-cells)

  tick
end

;----------- eat button ---------------
; Adds one meal's worth of glucose over the course of the defined meal time.

; Button procedure
; Either starts a new meal or extends a current meal.
to eat
  set eating? true
  set eat-time eat-time + meal-length
end

; Implements eating process. Adds one meal's worth of glucose at
; a constant rate, spread across the whole length of a meal.
to add-glucose
  create-glucoses (meal-size / meal-length) [
    random-position
    set color white
    set size molecule-size
  ]
  set eat-time eat-time - 1
  if eat-time < 1 [ set eating? false ]
end

;------------ setup helpers ---------------

; Particle procedure
; Place molecule at random location
to random-position
  setxy (min-pxcor + random-float (max-pxcor * 2))
        (min-pycor + random-float (max-pycor * 2))
end

; Sets up liver cells
to make-liver
  ask patches with [ pxcor < round (max-pxcor / 2) ] [
    sprout-liver-cells 1 [
      set shape "square 2"
      set color brown + 2
      set glucose-store random-poisson 150 ; Enough to survive for about a week.
    ]
  ]
end

; Sets up pancreatic cells
to make-pancreas
  ask patches with [ pxcor >= round (max-pxcor / 2) ] [
    sprout-pancreatic-cells 1 [
      set shape "square 2"
      set color yellow - 1
    ]
  ]
end

; ----------- signal procedures ------------

; Molecule procedure
to move
  rt random 90
  lt random 90
  fd 1
end

; Observer procedure
to signal-degradation
  ask insulins [
    set lifetime lifetime - 1
    if (lifetime <= 0) [ die ]
  ]
  ask glucagons [
    set lifetime lifetime - 1
    if (lifetime <= 0) [ die ]
  ]
end

; Observer procedure
to metabolize-glucose
  ifelse (count glucoses >= metabolic-rate) [
    ask n-of metabolic-rate glucoses [ die ]
  ] [
    ask glucoses [ die ]
  ]
end

;---------------- cell procedures ---------------
; Both cell types implement signal sensitivity using the binomial distribution.
; In this context, each signal's sensitivity slider directly governs the
; probability that a cell will detect the presence of that signal when it is
; present. Lowering the sensitivity makes cells more likely to miss signals.
; The binomial distribution gives the probability that a cell will detect k signals
; when n signals are present, given a detection probability p for each signal.
; This can be used to produce likely signal counts (or k's) for a cell with n
; signal molecules present and a given signal sensitivity.

; Liver procedure
; Releases or sequesters glucose based on the local hormone concentrations.
to adjust-glucose
  ; Detect hormones according to a binomial distribution based on their sensitivities.
  let insulin-count random-binomial (count insulins-here) insulin-sensitivity
  let glucagon-count random-binomial (count glucagons-here) glucagon-sensitivity

  ; A positive net signal means we release glucose.
  ; The stronger the signal (the larger the absolute value),
  ; the more glucose is released or sequestered.
  let net-signal glucagon-count - insulin-count

  ; If there is more glucagon signal than insulin signal, release glucose.
  if net-signal > 0 [
    ifelse (glucose-store >= net-signal) [
      ; If there is a lot of glucose stored in the cell, hatch new glucose molecules.
      hatch-glucoses net-signal [
        random-position
        set color white
        set size molecule-size
      ]
      ; Account for the change in stored glucose (net-signal > 0).
      set glucose-store glucose-store - net-signal
    ] [
      ; If there is not enough glucose stored in the cell, release as much as possible.
      hatch-glucoses glucose-store [
        random-position
        set color white
        set size molecule-size
      ]
      set glucose-store 0
    ]
  ]
  ; If there is more insulin signal than glucagon signal, sequester glucose.
  if net-signal < 0 [
    ifelse (count glucoses >= abs net-signal) [
      ; If there's a lot of blood glucose, sequester what you need (net-signal < 0).
      set glucose-store glucose-store - net-signal
      ask n-of abs net-signal glucoses [ die ]
    ] [
      ; If there's not ehough blood glucose, sequester as much as possible.
      set glucose-store glucose-store + count glucoses
      ask glucoses [ die ]
    ]
  ]
end

; Pancreas procedure
; Produces hormones according to the local glucose concentration.

; Hormones typically follow exponential decay, so their lifetimes
; are randomly drawn from an exponential distribution. This also
; makes the least assumptions, since the exponential distribution
; is the maximum-entropy distribution for a fixed, positive mean.
to adjust-hormones
  ; Detect glucose according to a binomial distribution based on the sensitivity.
  let glucose-count random-binomial (count glucoses-here) glucose-sensitivity
  ; Signal strength is determined by the difference in concentration from normal.
  let signal-count abs (glucose-baseline - glucose-count)

  ; If there are too few glucoses...
  if (glucose-count < glucose-baseline) [
    ; ...release glucagon molecules.
    hatch-glucagons signal-count [
      random-position
      set color red
      set size molecule-size * 2
      set lifetime random-exponential hormone-mean-life
    ]
  ]
  ; If there are too many glucoses...
  if (glucose-count > glucose-baseline) [
    ; ...release insulin molecules.
    hatch-insulins signal-count [
      random-position
      set color sky
      set size molecule-size * 2
      set lifetime random-exponential hormone-mean-life
    ]
  ]
end

;------------- follow procedures -------------

to follow-glucose
  watch one-of glucoses
end

to follow-insulin
  watch one-of insulins
end

to follow-glucagon
  watch one-of glucagons
end

;---------------- math helpers ----------------

; Returns the outcome of a Bernoulli trial with success probability p.
; Successes are reported as 1 and failures are reported as 0.
to-report random-bernoulli [ p ]
  report ifelse-value random-float 1 < p [1] [0]
end

; Returns a random number according to the binomial distribution with parameters n and p
; where n is the number of trials and p is the probability of success in each trial.
to-report random-binomial [n p]
  if (n < 0) or not (int n = n) [
    error "Input n must be a non-negative integer."
  ]
  if (p < 0) or (p > 1) [
    error "Probability p must be between 0 and 1."
  ]

  ; Sum the number of successes in n Bernoulli trials with success probability p.
  report sum n-values n [random-bernoulli p]
end


; Copyright 2017 Uri Wilensky.
; See Info tab for full copyright and license.`,
  `globals [
  ; Housekeeping variables
  cell-wall  ; Patch-set containing cell wall patches for boundary checking
  CRISPR     ; Patch-set containing CRISPR DNA patches for boundary checking
  virus-event

  ; Bacterial attributes
  array      ; List of viral spacers currently stored in the array

  labels? 
  initial-array-size 
  max-virus-types 
  guide-unbind-chance 
  processivity 
  crispr-function 
]

breed [ RNAPs RNAP ]            ; Brown
breed [ cas9s cas9 ]            ; Green
breed [ guide-RNAs guide-RNA ]  ; Lime
breed [ cas-dimers cas-dimer ]  ; Orange
breed [ viruses virus ]         ; Red

guide-RNAs-own [ sequence bound? ]
viruses-own [ sequence bound? ]
RNAPs-own [ on-dna? ]
cas9s-own [ bound? ]
cas-dimers-own [ bound? ]

to setup
  clear-all
  ; Build cell wall
  ask patches with [ abs pxcor = max-pxcor ] [ set pcolor gray ]
  ask patches with [ abs pycor = max-pycor ] [ set pcolor gray ]
  set cell-wall patches with [ pcolor = gray ]

  ; Build DNA and CRISPR array
  ask patches with [ (abs pycor = 2) and (abs pxcor <= 10) ] [ set pcolor blue ]
  ask patches with [ (abs pxcor = 10) and (abs pycor <= 2) ] [ set pcolor blue ]
  ; Build CRISPR array (on a plasmid)
  ask patches with [ (pycor = 0) and (abs pxcor <= 2) ] [ set pcolor sky + 1 ]
  set CRISPR patches with [ pcolor = sky + 1 ]
  ask min-one-of CRISPR [ pxcor ] [ set pcolor cyan ]

  set virus-event ""
  set array n-values initial-array-size [ random max-virus-types ]

  set-default-shape guide-RNAs "stripe"
  set-default-shape viruses "stripe"

  ; Build polymerases
  create-RNAPs 25 [
    set shape "rnap"
    set color brown
    set on-dna? false
  ]

  ; Initialize the other agent types at steady state.
  ; Instead of needing to run the model for 1000+ ticks, we can use a shortcut:
  ; Produce tons of agents through the normal transcription process
  ; and then degrade the appropriate amount.
  ; Production and degradation of normal cell components only depend on time,
  ; not interactions between agents, so this saves us the time that would be
  ; spent processing particle motion, interactions, and visualization.
  let ticks-per-transcription crispr-function / 8  ; Approximate, found by trial and error.
  let transcripts-per-RNAP 5
  let transcriptions transcripts-per-RNAP * count RNAPs
  ask RNAPs [
    repeat transcripts-per-RNAP [
      if random-float 100 < crispr-function [ transcribe ]
    ]
  ]
  repeat transcriptions * ticks-per-transcription [ degrade ]

  ask turtles [
    ; Loop-stop construct here imitates a do-while loop.
    loop [
      setxy random-xcor random-ycor
      if not member? patch-here cell-wall [ stop ]
    ]
  ]

  update-labels
  reset-ticks
end

to go
  update-labels
  if infected? [ stop ]
  ask RNAPs [ go-RNAPs ]
  ask cas9s [ go-cas9s ]
  ask guide-RNAs [ go-guide-RNAs ]
  ask cas-dimers [ go-cas-dimers ]
  ask viruses [ go-viruses ]
  degrade
  tick
end

; Simulates a virus entering the cell through the cell membrane.
to infect [ seq ] ; Observer procedure
  ask one-of cell-wall [
    sprout-viruses 1 [
      set sequence seq
      set color red
      set bound? false
      set virus-event (word "Virus " sequence " invaded the cell.")
    ]
  ]
end

to common-infection
  let guides remove-duplicates map [ i ->
    list (item i array) (count guide-RNAs with [sequence = (item i array)])
  ] n-values length array [ i -> i ]
  set guides sort-by [ [list1 list2] -> item 1 list1 > item 1 list2 ] guides
  let front-range ceiling (processivity / 200 * length array)
  infect item 0 one-of sublist guides 0 front-range
end

; RNAPs move randomly when not on DNA. Under certain circumstances, they
; transcribe the CRISPR array to produce new cas9 proteins, cas1-cas2 dimers,
; and one guide RNA for each spacer in the CRISPR array.
to go-RNAPs ; RNAP procedure
  ifelse on-dna? [
    ; If we are currently transcribing the CRISPR array, keep doing that.
    fd 1
    ; Once we finish, change back to normal movement and produce CRISPR elements.
    if not member? patch-here CRISPR [
      set on-dna? false
      transcribe
    ]
  ] [
    ; If we are not transcribing, move around randomly.
    move 1
    ; If we end up on the CRISPR promoter, start transcribing.
    if pcolor = cyan and random-float 100 < crispr-function [
      set on-dna? true
      move-to patch-here
      set heading 90
    ]
  ]
end

; Cas9 proteins randomly wander through the cell. If they find a guide RNA,
; they can bind to it. If they are already bound to a guide RNA, there is a
; small chance they will unbind it. If they have a guide and find a virus
; with a matching sequence, they cleave the virus.
to go-cas9s
  ; If bound to a guide RNA, several things could happen.
  if bound? [
    ; If there is a virus here, check if it matches the bound guide RNA.
    if any? viruses-here with [ not bound? ] [
      let virus-partner one-of viruses-here
      let partner-sequence [ sequence ] of one-of link-neighbors
      let virus-sequence [ sequence ] of virus-partner
      ; If it matches, destroy the virus.
      if partner-sequence = virus-sequence [
        ask virus-partner [
          set virus-event (word "Virus " sequence " was cleaved by cas9.")
          die
        ]
      ]
    ]
    ; Randomly unbind current guide at a low rate.
    if random-float 100 < guide-unbind-chance [
      ; There should only ever be one guide RNA linked to a cas9 at a time.
      let partner one-of link-neighbors
      ask my-links [ die ]
      ; Update bound? status and appearance for the cas9 and guide RNA.
      set bound? false
      set shape "cas9"
      ask partner [
        set bound? false
        move 1
      ]
    ]
  ]
  ; Random walk through the cell.
  move 1
  ; If the cas9 is unbound and near an unbound guide RNA, bind it.
  if not bound? and any? guide-RNAs-here with [ not bound? ] [
    ; Grab an unbound guide RNA in the area and tie to it.
    let partner one-of guide-RNAs-here with [ not bound? ]
    move-to partner
    create-link-with partner [ hide-link tie ]
    ; Update bound? status and appearance for the cas9 and guide RNA.
    set bound? true
    ask partner [ set bound? true ]
  ]
end

; Guide RNAs drift randomly through the cell. For more information, see go-cas9s.
to go-guide-RNAs ; Guide-RNA procedure
  if not bound? [ move 1 ]
end

; Cas1-Cas2 dimers drift randomly through the cell most of the time. When they
; encounter viral genetic material, they carry it to the CRISPR array and
; incorporate a new spacer into the array to match it.
to go-cas-dimers ; Cas-dimer procedure
  ifelse bound? [
    ; If the dimer is carrying viral material, head towards the CRISPR locus.
    set heading towards one-of CRISPR
    fd 1
    ; Once the dimer gets to the locus, add an appropriate spacer and kill the virus.
    if member? patch-here CRISPR [
      let virus-partner one-of link-neighbors
      set array fput ([ sequence ] of virus-partner) array
      ask virus-partner [
        set virus-event (word "Virus " sequence " was added to the array.")
        die
      ]
      set bound? false
    ]
  ] [
    ; If the dimer isn't carrying viral material, wander randomly.
    move 1
    ; If the dimer finds a virus, bind to it.
    if any? viruses-here with [ not bound? ] [
      let virus-partner one-of viruses-here
      move-to virus-partner
      create-link-with virus-partner [ hide-link tie ]
      set bound? true
      ask virus-partner [
        set bound? true
        set virus-event (word "Virus " sequence " was bound by cas1/2.")
      ]
    ]
  ]
end

; If the virus isn't bound to anything (meaning it isn't caught by the cell yet),
; it wanders randomly until it finds the cell's DNA and inserts itself.
to go-viruses ; Virus procedure
  if not bound? [
    ; Move slowly because of its enormous size, but generally towards the DNA.
    set heading towards one-of dna-patches
    fd 0.05
    ; Incorporate into the genome.
    if pcolor = blue [
      move-to patch-here
      set shape "square"
      set bound? true
      set virus-event (word "Virus " sequence " infected the genome.")
      watch-me
    ]
  ]
end

; Controls the random movement of all turtles.
; If you're headed towards the cell wall, just turn until you're not.
to move [ speed ]  ; Turtle procedure
  rt random-float 360
  while [ wall-ahead? ] [ rt random-float 360 ]
  forward speed
end

; Implements the transcription / translation of the CRISPR array.
; The entire array is transcribed together.
to transcribe ; RNAP procedure
  ; The cas9 gene comes at the start of the CRISPR array.
  hatch-cas9s 1 [
    set color green
    set shape "cas9"
    set bound? false
    ; Distribute around the center of the cell
    setxy 0 0
    repeat 5 [ move 1 ]
  ]
  ; The array also includes genes for the Cas1-Cas2 complexes.
  ; Each complex needs 2 Cas2 proteins and 4 Cas1 proteins, so
  ; on average one complex will be produced every 4 transcriptions.
  if random-float 1 < 0.25 [
    hatch-cas-dimers 1 [
      set color orange
      set shape "cas dimer"
      set bound? false
      ; Distribute around the center of the cell
      setxy 0 0
      repeat 5 [ move 1 ]
    ]
  ]
  ; After the cas genes there are copies of each spacer all in a row,
  ; and we produce one guide RNA for each spacer in the array.
  foreach array [ spacer ->
    hatch-guide-RNAs 1 [
      set color turquoise
      set sequence spacer
      set bound? false
      ; Distribute around the center of the cell
      setxy 0 0
      repeat 5 [ move 1 ]
    ]
    ; High processivity should mean a smaller chance to stop early.
    ; This stop exits the foreach, but not the transcribe procedure.
    if random-float 100 > processivity [ stop ]
  ]
end

; Governs the degradation of proteins and genetic elements in the cell.
to degrade ; Observer procedure
  ; These ask blocks require all turtles in the set to have the variable bound?.

  ; Degrade Cas9 proteins and guide RNAs at a low rate.
  ask (turtle-set cas9s guide-RNAs) [
    if random-float 100 < 0.05 [
      if bound? [
        ask link-neighbors [ set bound? false ]
      ]
      die
    ]
  ]
  ; Viruses and Cas1-Cas2 complexes degrade at a higher rate than Cas9s and guides.
  ; For viruses, innate immune systems like restriction enzymes increase degradation.
  ask viruses [
    if random-float 100 < 0.5 [
      if bound? [
        ask link-neighbors [ set bound? false ]
      ]
      set virus-event (word "Virus " sequence " was degraded by innate resistance.")
      die
    ]
  ]
  ; For Cas1-Cas2 complexes, the whole thing stops working if any of the 6 components
  ; stop working. This is the simplest way to account for that without trying to
  ; model each component as a separate agent.
  ask cas-dimers [
    if random-float 100 < 0.2 [
      if bound? [
        ask link-neighbors [ set bound? false ]
      ]
      die
    ]
  ]

  ; Random low-level loss of spacers from the CRISPR array.
  if random-float 100 < 0.001 and not empty? array [
    set array remove-item (random length array) array
  ]
end

to update-labels
  ifelse labels? [
    ask (turtle-set guide-RNAs viruses) [ set label sequence ]
  ] [
    ask turtles [ set label "" ]
  ]
end

; Called in the 'Plot update commands' block of the histogram plots.
; Adjusts the x and y ranges of the histogram dynamically based on the input data.
to update-histogram-ranges [ input-list interval ]
  ; If the input list is empty, let the plot use its default ranges.
  ; Otherwise, adjust the plot axis ranges to fit the input data.
  if not empty? input-list [
    ; Adjust the x range to include the whole input data set.
    ; The x range expands with the data, but never contracts.
    let plot-upper-bound max list plot-x-max (interval + max input-list)
    let plot-lower-bound min list plot-x-min min input-list
    set-plot-x-range plot-lower-bound plot-upper-bound

    ; Adjust the y range based on the input data, avoiding constant shifts.
    ; Find the max bar height using the mode(s) of the input data.
    let list-modes-unique modes input-list
    let list-modes-enumerated filter [ i -> member? i list-modes-unique ] input-list
    let max-bar-height (length list-modes-enumerated) / (length list-modes-unique)
    ; The y range should be about 150% of the max bar height, within a tolerance.
    let grow-threshold ceiling (1.05 * max-bar-height)  ; Bar > 95% of the y max
    let shrink-threshold floor (2 * max-bar-height)     ; Bar < 50% of the y max
    if (plot-y-max <= grow-threshold) or (plot-y-max >= shrink-threshold) [
      set-plot-y-range 0 ceiling (1.5 * max-bar-height) ; Bar = 67% of the y max
    ]
  ]
end

;------------------------------------------------------------------------------;
; Useful reporters

to-report wall-ahead? ; Turtle procedure
  report (member? patch-ahead 1 cell-wall) or (member? patch-ahead 2 cell-wall)
end

to-report dna-patches
  report patches with [pcolor = blue]
end

to-report infected?
  report any? viruses with [shape = "square"]
end


; Copyright 2019 Uri Wilensky.
; See Info tab for full copyright and license.`,
  `globals [
  ; Housekeeping variables
  cell-wall  ; Patch-set containing cell wall patches for boundary checking
  CRISPR     ; Patch-set containing CRISPR DNA patches for boundary checking
  the-virus  ; Stores the virus in the infection
  virus-event

  ; Bacterial attributes
  array      ; List of viral spacers currently stored in the array

  labels?
  initial-array-size 
  max-virus-types 
  guide-unbind-chance 
  processivity 
  CRISPR-function 
]

breed [ RNAPs RNAP ]            ; Brown
breed [ cas9s cas9 ]            ; Green
breed [ guide-RNAs guide-RNA ]  ; Lime
breed [ cas-dimers cas-dimer ]  ; Orange
breed [ viruses virus ]         ; Red

guide-RNAs-own [ sequence bound? ]
viruses-own [ sequence bound? ]
RNAPs-own [ on-dna? ]
cas9s-own [ bound? ]
cas-dimers-own [ bound? ]

to setup [ CRISPR-array unbind-% rnap-processivity-% CRISPR-function-% ]
  clear-all
  ; Build cell wall
  ask patches with [ abs pxcor = max-pxcor ] [ set pcolor gray ]
  ask patches with [ abs pycor = max-pycor ] [ set pcolor gray ]
  set cell-wall patches with [ pcolor = gray ]

  ; Build DNA and CRISPR array
  ask patches with [ (abs pycor = 2) and (abs pxcor <= 10) ] [ set pcolor blue ]
  ask patches with [ (abs pxcor = 10) and (abs pycor <= 2) ] [ set pcolor blue ]
  ; Build CRISPR array (on a plasmid)
  ask patches with [ (pycor = 0) and (abs pxcor <= 2) ] [ set pcolor sky + 1 ]
  set CRISPR patches with [ pcolor = sky + 1 ]
  ask min-one-of CRISPR [ pxcor ] [ set pcolor cyan ]

  set virus-event ""
  set array CRISPR-array
  set guide-unbind-chance unbind-%
  set processivity rnap-processivity-%
  set CRISPR-function CRISPR-function-%

  set-default-shape guide-RNAs "stripe"
  set-default-shape viruses "stripe"

  ; Build polymerases
  create-RNAPs 25 [
    set shape "rnap"
    set color brown
    set on-dna? false
  ]

  ; Initialize the other agent types at steady state.
  ; Instead of needing to run the model for 1000+ ticks, we can use a shortcut:
  ; Produce tons of agents through the normal transcription process
  ; and then degrade the appropriate amount.
  ; Production and degradation of normal cell components only depend on time,
  ; not interactions between agents, so this saves us the time that would be
  ; spent processing particle motion, interactions, and visualization.
  let ticks-per-transcription CRISPR-function / 8  ; Approximate, found by trial and error.
  let transcripts-per-RNAP 5
  let transcriptions transcripts-per-RNAP * count RNAPs
  ask RNAPs [
    repeat transcripts-per-RNAP [
      if random-float 100 < CRISPR-function [ transcribe ]
    ]
  ]
  repeat transcriptions * ticks-per-transcription [ degrade ]

  ask turtles [
    ; Loop-stop construct here imitates a do-while loop.
    loop [
      setxy random-xcor random-ycor
      if not member? patch-here cell-wall [ stop ]
    ]
  ]

  update-labels
  reset-ticks
end

to go
  update-labels
  if done? [ stop ]
  ask RNAPs [ go-RNAPs ]
  ask cas9s [ go-cas9s ]
  ask guide-RNAs [ go-guide-RNAs ]
  ask cas-dimers [ go-cas-dimers ]
  ask viruses [ go-viruses ]
  degrade
  tick
end

; Simulates a virus entering the cell through the cell membrane.
to infect [ seq ] ; Observer procedure
  ask one-of cell-wall [
    sprout-viruses 1 [
      set sequence seq
      set color red
      set bound? false
      set virus-event (word "Virus " sequence " invaded the cell.")
      watch-me
      set the-virus self
    ]
  ]
end

to common-infection
  let guides remove-duplicates map [ i ->
    list (item i array) (count guide-RNAs with [sequence = (item i array)])
  ] n-values length array [ i -> i ]
  set guides sort-by [ [list1 list2] -> item 1 list1 > item 1 list2 ] guides
  let front-range ceiling (processivity / 200 * length array)
  infect item 0 one-of sublist guides 0 front-range
end

; RNAPs move randomly when not on DNA. Under certain circumstances, they
; transcribe the CRISPR array to produce new cas9 proteins, cas1-cas2 dimers,
; and one guide RNA for each spacer in the CRISPR array.
to go-RNAPs ; RNAP procedure
  ifelse on-dna? [
    ; If we are currently transcribing the CRISPR array, keep doing that.
    fd 1
    ; Once we finish, change back to normal movement and produce CRISPR elements.
    if not member? patch-here CRISPR [
      set on-dna? false
      transcribe
    ]
  ] [
    ; If we are not transcribing, move around randomly.
    diffuse-turtle 1
    ; If we end up on the CRISPR promoter, start transcribing.
    if pcolor = cyan and random-float 100 < CRISPR-function [
      set on-dna? true
      move-to patch-here
      set heading 90
    ]
  ]
end

; Cas9 proteins randomly wander through the cell. If they find a guide RNA,
; they can bind to it. If they are already bound to a guide RNA, there is a
; small chance they will unbind it. If they have a guide and find a virus
; with a matching sequence, they cleave the virus.
to go-cas9s
  ; If bound to a guide RNA, several things could happen.
  if bound? [
    ; If there is a virus here, check if it matches the bound guide RNA.
    if any? viruses-here with [ not bound? ] [
      let virus-partner one-of viruses-here
      let partner-sequence [ sequence ] of one-of link-neighbors
      let virus-sequence [ sequence ] of virus-partner
      ; If it matches, destroy the virus.
      if partner-sequence = virus-sequence [
        ask virus-partner [
          set virus-event (word "Virus " sequence " was cleaved by cas9.")
          die
        ]
      ]
    ]
    ; Randomly unbind current guide at a low rate.
    if random-float 100 < guide-unbind-chance [
      ; There should only ever be one guide RNA linked to a cas9 at a time.
      let partner one-of link-neighbors
      ask my-links [ die ]
      ; Update bound? status and appearance for the cas9 and guide RNA.
      set bound? false
      ask partner [
        set bound? false
        diffuse-turtle 1
      ]
    ]
  ]
  ; Random walk through the cell.
  diffuse-turtle 1
  ; If the cas9 is unbound and near an unbound guide RNA, bind it.
  if not bound? and any? guide-RNAs-here with [ not bound? ] [
    ; Grab an unbound guide RNA in the area and tie to it.
    let partner one-of guide-RNAs-here with [ not bound? ]
    move-to partner
    create-link-with partner [ hide-link tie ]
    ; Update bound? status and appearance for the cas9 and guide RNA.
    set bound? true
    ask partner [ set bound? true ]
  ]
end

; Guide RNAs drift randomly through the cell. For more information, see go-cas9s.
to go-guide-RNAs ; Guide-RNA procedure
  if not bound? [ diffuse-turtle 1 ]
end

; Cas1-Cas2 dimers drift randomly through the cell most of the time. When they
; encounter viral genetic material, they carry it to the CRISPR array and
; incorporate a new spacer into the array to match it.
to go-cas-dimers ; Cas-dimer procedure
  ifelse bound? [
    ; If the dimer is carrying viral material, head towards the CRISPR locus.
    set heading towards one-of CRISPR
    fd 1
    ; Once the dimer gets to the locus, add an appropriate spacer and kill the virus.
    if member? patch-here CRISPR [
      let virus-partner one-of link-neighbors
      set array fput ([ sequence ] of virus-partner) array
      ask virus-partner [
        set virus-event (word "Virus " sequence " was added to the array.")
      ]
    ]
  ] [
    ; If the dimer isn't carrying viral material, wander randomly.
    diffuse-turtle 1
    ; If the dimer finds a virus, bind to it.
    if any? viruses-here with [ not bound? ] [
      let virus-partner one-of viruses-here
      move-to virus-partner
      create-link-with virus-partner [ hide-link tie ]
      set bound? true
      ask virus-partner [
        set bound? true
        set virus-event (word "Virus " sequence " was bound by cas1/2.")
      ]
    ]
  ]
end

; If the virus isn't bound to anything (meaning it isn't caught by the cell yet),
; it wanders randomly until it finds the cell's DNA and inserts itself.
to go-viruses ; Virus procedure
  if not bound? [
    ; Move slowly because of its enormous size, but generally towards the DNA.
    set heading towards one-of dna-patches
    fd 0.05
    ; Incorporate into the genome.
    if pcolor = blue [
      move-to patch-here
      set shape "square"
      set bound? true
      set virus-event (word "Virus " sequence " infected the genome.")
      watch-me
    ]
  ]
end

; Controls the random movement of all turtles.
; If you're headed towards the cell wall, just turn until you're not.
to diffuse-turtle [ speed ]  ; Turtle procedure
  rt random-float 360
  while [ wall-ahead? ] [ rt random-float 360 ]
  forward speed
end

; Implements the transcription / translation of the CRISPR array.
; The entire array is transcribed together.
to transcribe ; RNAP procedure
  ; The cas9 gene comes at the start of the CRISPR array.
  hatch-cas9s 1 [
    set color green
    set shape "cas9"
    set bound? false
    ; Distribute around the center of the cell
    setxy 0 0
    repeat 5 [ diffuse-turtle 1 ]
  ]
  ; The array also includes genes for the Cas1-Cas2 complexes.
  ; Each complex needs 2 Cas2 proteins and 4 Cas1 proteins, so
  ; on average one complex will be produced every 4 transcriptions.
  if random-float 1 < 0.25 [
    hatch-cas-dimers 1 [
      set color orange
      set shape "cas dimer"
      set bound? false
      ; Distribute around the center of the cell
      setxy 0 0
      repeat 5 [ diffuse-turtle 1 ]
    ]
  ]
  ; After the cas genes there are copies of each spacer all in a row,
  ; and we produce one guide RNA for each spacer in the array.
  foreach array [ spacer ->
    hatch-guide-RNAs 1 [
      set color turquoise
      set sequence spacer
      set bound? false
      ; Distribute around the center of the cell
      setxy 0 0
      repeat 5 [ diffuse-turtle 1 ]
    ]
    ; High processivity should mean a smaller chance to stop early.
    ; This stop exits the foreach, but not the transcribe procedure.
    if random-float 100 > processivity [ stop ]
  ]
end

; Governs the degradation of proteins and genetic elements in the cell.
to degrade ; Observer procedure
  ; These ask blocks require all turtles in the set to have the variable bound?.

  ; Degrade Cas9 proteins and guide RNAs at a low rate.
  ask (turtle-set cas9s guide-RNAs) [
    if random-float 100 < 0.05 [
      if bound? [
        ask link-neighbors [ set bound? false ]
      ]
      die
    ]
  ]
  ; Viruses and Cas1-Cas2 complexes degrade at a higher rate than Cas9s and guides.
  ; For viruses, innate immune systems like restriction enzymes increase degradation.
  ask viruses [
    if random-float 100 < 0.5 [
      if bound? [
        ask link-neighbors [ set bound? false ]
      ]
      set virus-event (word "Virus " sequence " was degraded by innate resistance.")
      die
    ]
  ]
  ; For Cas1-Cas2 complexes, the whole thing stops working if any of the 6 components
  ; stop working. This is the simplest way to account for that without trying to
  ; model each component as a separate agent.
  ask cas-dimers [
    if random-float 100 < 0.2 [
      if bound? [
        ask link-neighbors [ set bound? false ]
      ]
      die
    ]
  ]
end

to update-labels
  ifelse labels? [
    ask (turtle-set guide-RNAs viruses) [ set label sequence ]
  ] [
    ask turtles [ set label "" ]
  ]
end

; Called in the 'Plot update commands' block of the histogram plots.
; Adjusts the x and y ranges of the histogram dynamically based on the input data.
to update-histogram-ranges [ input-list interval ]
  ; If the input list is empty, let the plot use its default ranges.
  ; Otherwise, adjust the plot axis ranges to fit the input data.
  if not empty? input-list [
    ; Adjust the x range to include the whole input data set.
    ; The x range expands with the data, but never contracts.
    let plot-upper-bound max list plot-x-max (interval + max input-list)
    let plot-lower-bound min list plot-x-min min input-list
    set-plot-x-range plot-lower-bound plot-upper-bound

    ; Adjust the y range based on the input data, avoiding constant shifts.
    ; Find the max bar height using the mode(s) of the input data.
    let list-modes-unique modes input-list
    let list-modes-enumerated filter [ i -> member? i list-modes-unique ] input-list
    let max-bar-height (length list-modes-enumerated) / (length list-modes-unique)
    ; The y range should be about 150% of the max bar height, within a tolerance.
    let grow-threshold ceiling (1.05 * max-bar-height)  ; Bar > 95% of the y max
    let shrink-threshold floor (2 * max-bar-height)     ; Bar < 50% of the y max
    if (plot-y-max <= grow-threshold) or (plot-y-max >= shrink-threshold) [
      set-plot-y-range 0 ceiling (1.5 * max-bar-height) ; Bar = 67% of the y max
    ]
  ]
end

;------------------------------------------------------------------------------;
; Useful reporters

to-report wall-ahead? ; Turtle procedure
  report (member? patch-ahead 1 cell-wall) or (member? patch-ahead 2 cell-wall)
end

to-report dna-patches
  report patches with [pcolor = blue]
end

to-report done?
  report virus-dead? or virus-added? or dna-infected?
end

to-report virus-dead?
  report not any? viruses
end

to-report virus-added?
  ; If the virus is dead, this reporter will be false. The conditional report
  ; is required to avoid a runtime error from using 'of' on a dead agent.
  if virus-dead? [ report false ]
  report [member? patch-here CRISPR and bound?] of the-virus
end

to-report dna-infected?
  ; If the virus is dead, this reporter will be false. The conditional report
  ; is required to avoid a runtime error from using 'of' on a dead agent.
  if virus-dead? [ report false ]
  ; When the virus has infected the cell, it sets bound? true and changes to
  ; a square, but the square shape is the only unique identifier.
  ; If you just check for being on the DNA while bound, any time a protein
  ; binds it and moves over the DNA this reporter will be true.
  report [shape = "square"] of the-virus
end


; Copyright 2019 Uri Wilensky.
; See Info tab for full copyright and license.`,
  `globals [
  food-color                     ; Color of food.
  bacteria-color                 ; Color of bacteria.
  virus-color                    ; Color of viruses.
  bacteria-size                  ; Size of bacteria, also virus scale factor.

  sprout-delay-time              ; Time for food to regrow after being consumed.
  max-food-energy                ; Max amount of food energy per patch.
  min-reproduce-energy           ; Min energy required for bacteria to reproduce.

  food-growth-rate               ; How fast food is replenished on average.
  food-bacteria-eat              ; Amount of food bacteria eat each time step.
  regrowth-variability           ; Adjusts regrowth rates (see replenish-food).

  virus-replication-rate         ; Number of viruses created in a lytic cycle.

  virus-history                  ; Required for plot housekeeping.
                                 ; This can be removed if 1) a primitive to get all
                                 ; current plot pens as a list is added, or 2) a
                                 ; way to remove temporary plot pens without also
                                 ; clearing the plot or that pen's trail is added.
  plot-virus                     ; Required for clean switching on coevolution plot.

  initial-bacteria 
  initial-viruses 
  max-virus-types 
  infection-chance 
  spacer-loss-chance 
  crispr? 
  plotted-virus
]

breed [ foods food ]
breed [ bacteria bacterium ]
breed [ viruses virus ]

viruses-own [ sequence ]
bacteria-own [ energy array ]

patches-own [ food-energy countdown ]

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; SETUP PROCEDURES ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

to setup
  clear-all

  set food-color     [90 140 90 150]
  set bacteria-color  orange
  set virus-color     violet

  set-default-shape bacteria "bacteria"
  set-default-shape viruses  "virus"
  set-default-shape foods    "food"

  set bacteria-size 1

  set min-reproduce-energy 100
  set sprout-delay-time 25
  set max-food-energy 100
  set food-bacteria-eat 25
  set food-growth-rate 25
  set regrowth-variability 1

  set virus-replication-rate 20

  setup-world
  setup-virus-plot
  reset-ticks
end

to setup-world
  ask patches [
    set food-energy max-food-energy / 2
    set countdown 0
    ; Make patches blue (water colored) and hatch food in water spots
    set pcolor [180 200 230]
    sprout-foods 1 [ set color food-color ]
  ]

  ask patches [ grow-food ]

  create-bacteria initial-bacteria [
    set size bacteria-size
    set color bacteria-color
    set energy random-normal (min-reproduce-energy / 2) (min-reproduce-energy / 10)
    set array []
    random-position
  ]
  create-viruses initial-viruses [
    set size bacteria-size / 2
    set color virus-color
    set sequence random max-virus-types
    random-position
  ]
end

to random-position
  setxy (min-pxcor + random-float (max-pxcor * 2))
        (min-pycor + random-float (max-pycor * 2))
end

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; RUNTIME PROCEDURES ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

to go
  if count bacteria < 1 [ stop ]
  if count viruses < 1 [ stop ]
  bacteria-live
  viruses-live
  ask patches [ replenish-food ]
  update-virus-plot
  tick
end

;----------------------------- BACTERIA PROCEDURES -----------------------------

to bacteria-live
  ask bacteria [
    move-bacteria
    bacteria-eat-food
    reproduce-bacteria
    spacer-loss
    if (energy <= 0 ) [ die ]
  ]
end

to move-bacteria ; Bacteria procedure
  set energy (energy - 1)  ; Bacteria lose energy as they move
  rt random-float 90
  lt random-float 90
  fd 0.25  ; The lower the speed, the less severe the population oscillations are.
end

to bacteria-eat-food ; Bacteria procedure
  ; If there is enough food on this patch, the bacteria eat it and gain energy.
  if food-energy > food-bacteria-eat [
    ; Bacteria gain 1/5 the energy of the food they eat (trophic level assumption)
    set food-energy (food-energy - food-bacteria-eat)
    set energy energy + food-bacteria-eat / 5  ; bacteria gain energy by eating
  ]
  ; If all the food is consumed in a patch, set the countdown timer
  ; to delay when the food will grow back in this patch.
  if food-energy <= food-bacteria-eat [ set countdown sprout-delay-time ]
end

to reproduce-bacteria ; Bacteria procedure
 if (energy >  min-reproduce-energy) [
    set energy (energy / 2)  ; Parent keeps half the cell's energy
    ; Variable inheritance gives the daughter half the cell's energy too
    hatch 1 [
      rt random 360
      fd 0.25
    ]
  ]
end

to spacer-loss ; Bacteria procedure
  if not empty? array and random-float 100 < spacer-loss-chance [
    ; Spacers loss is FIFO and we add to the front of the array.
    set array but-last array
  ]
end

;------------------------------ VIRUS PROCEDURES -------------------------------

to viruses-live
  ask viruses [
    move-virus
    infect
    maybe-degrade
  ]
end

to move-virus
  rt random-float 90
  lt random-float 90
  fd 0.10
end

to infect
  let target one-of bacteria-here
  if (target != nobody) and (random-float 100 < infection-chance) [
    ifelse crispr? [
      ; If the bacteria have functioning CRISPR systems...
      ifelse member? sequence ([ array ] of target) [
        ; If the bacterium has the viral sequence in its CRISPR array,
        ; there is a very large chance that the virus dies.
        let succeed-chance 8 ; % chance the virus kills the bacterium and replicates
        let degrade-chance 83 ; % chance the virus gets cleaved or degraded
        let add-chance 9     ; % chance the virus gets caught and added to the array
        let random-roll random-float (succeed-chance + degrade-chance + add-chance)
        (ifelse
          ; Sometimes the virus will successfully reproduce.
          random-roll < succeed-chance [ replicate target ]
          ; Sometimes the bacterium will catch the virus and degrade it.
          random-roll < succeed-chance + degrade-chance [ die ]
          [ ask target [ set array fput [sequence] of myself array ] die ])
      ] [
        ; If the virus isn't in the CRISPR array, it can still get caught.
        ; New chances after reducing dimer production:
        let succeed-chance 30 ; % chance the virus kills the bacterium and replicates
        let degrade-chance 55 ; % chance the virus gets cleaved or degraded
        let add-chance 15     ; % chance the virus gets caught and added to the array
        let random-roll random-float (succeed-chance + degrade-chance + add-chance)
        (ifelse
          ; Sometimes the virus will successfully reproduce.
          random-roll < succeed-chance [ replicate target ]
          ; Sometimes the bacterium will catch the virus and degrade it.
          random-roll < succeed-chance + degrade-chance [ die ]
          [ ask target [ set array fput [sequence] of myself array ] die ])
      ]
    ] [
      ; If the bacteria do not have functioning CRISPR systems, the bacteria
      ; still have non-specific antiviral defenses that may help.
      let succeed-chance 50 ; % chance the virus kills the bacterium and replicates
      let degrade-chance 50 ; % chance the virus gets cleaved or degraded
      let random-roll random-float (succeed-chance + degrade-chance)
      (ifelse
        ; Sometimes the bacterium will catch the virus and degrade it.
        random-roll < degrade-chance [ die ] [ replicate target ])
    ]
  ]
end

to replicate [ host ]
  ask host [ die ]
  ; Small chance viruses will mutate when they replicate
  ; As long as sequence is a random int, there is a ~5% chance of mutation
  if random-float 1 < 0.05 [ set sequence random max-virus-types ]
  ; Since the initial virus doesn't die in the model but would IRL, subtract 1.
  hatch virus-replication-rate - 1
end


to maybe-degrade
  if random-float 100 < 1 [ die ]
end

;------------------------------ FOOD PROCEDURES -------------------------------

; Food replenishes every time step (e.g. photosynthesis, etc.)
to replenish-food
  ; To change resource restoration variability do the following:
  ; In setup, set regrowth-variability n
  ; - 1/n chance to regrow this tick
  ; - n times as much regrowth as normal when it happens
  set countdown (countdown - 1)
  ; Fertile patches gain 1 energy unit per turn, up to max-food-energy threshold
  if countdown <= 0 and random regrowth-variability = 0 [
    set food-energy (food-energy + food-growth-rate * regrowth-variability / 10)
    if food-energy > max-food-energy [ set food-energy max-food-energy ]
  ]
  if food-energy < 0 [
    set food-energy 0
    set countdown sprout-delay-time
  ]
  grow-food
end

; Adjust the size of the food to reflect how much food is in that patch
to grow-food
  ask foods-here [
    ifelse food-energy >= 5 [
      set size (food-energy / max-food-energy)
    ] [
      set size (5 / max-food-energy)
    ]
  ]
end

;------------------------------ PLOT PROCEDURES --------------------------------

to setup-virus-plot ; Observer procedure
  set plot-virus plotted-virus
  set-current-plot "Virus Relative Abundance"
  ; Record each existing virus type.
  set virus-history remove-duplicates [sequence] of viruses
  ; Create pens for each existing virus type.
  foreach virus-history [ seq ->
    ; Cast the sequence to a string and use that as the pen's name.
    create-temporary-plot-pen word seq ""
    set-plot-pen-color one-of base-colors + one-of [-2 0 2]
    plotxy 0 (100 * (count viruses with [sequence = seq]) / (max list 1 count viruses))
  ]
end

to update-virus-plot
  set-current-plot "Virus Relative Abundance"
  ; Record any new viruses that may have arisen from mutation.
  set virus-history remove-duplicates sentence ([sequence] of viruses) virus-history
  foreach virus-history [ seq ->
    ; Cast the sequence to a string and use that as the pen's name.
    let pen-name word seq ""
    ; Switch to that pen if it exists, create a new one if it doesn't.
    ifelse plot-pen-exists? pen-name [
      set-current-plot-pen pen-name
    ] [
      create-temporary-plot-pen pen-name
      set-plot-pen-color one-of base-colors + one-of [-2 0 2]
    ]
    ; After setting the appropriate pen as current, plot the next point.
    plotxy (ticks + 1) (100 * (count viruses with [sequence = seq]) / (max list 1 count viruses))
  ]
end

; Called in the 'Plot update commands' block of the histogram plots.
; Adjusts the x and y ranges of the histogram dynamically based on the input data.
to update-histogram-ranges [ input-list interval ]
  ; If the input list is empty, let the plot use its default ranges.
  ; Otherwise, adjust the plot axis ranges to fit the input data.
  if not empty? input-list [
    ; Adjust the x range to include the whole input data set.
    ; The x range expands with the data, but never contracts.
    let plot-upper-bound max list plot-x-max (interval + max input-list)
    let plot-lower-bound min list plot-x-min min input-list
    set-plot-x-range plot-lower-bound plot-upper-bound

    ; Adjust the y range based on the input data, avoiding constant shifts.
    ; Find the max bar height using the mode(s) of the input data.
    let list-modes-unique modes input-list
    let list-modes-enumerated filter [ i -> member? i list-modes-unique ] input-list
    let max-bar-height (length list-modes-enumerated) / (length list-modes-unique)
    ; The y range should be about 150% of the max bar height, within a tolerance.
    let grow-threshold ceiling (1.05 * max-bar-height)  ; Bar > 95% of the y max
    let shrink-threshold floor (2 * max-bar-height)     ; Bar < 50% of the y max
    if (plot-y-max <= grow-threshold) or (plot-y-max >= shrink-threshold) [
      set-plot-y-range 0 ceiling (1.5 * max-bar-height) ; Bar = 67% of the y max
    ]
  ]
end


; Copyright 2019 Uri Wilensky.
; See Info tab for full copyright and license.`,
  `extensions [ ls ]

globals [
  food-color                     ; Color of food.
  bacteria-color                 ; Color of bacteria.
  virus-color                    ; Color of viruses.
  bacteria-size                  ; Size of bacteria, also virus scale factor.

  sprout-delay-time              ; Time for food to regrow after being consumed.
  max-food-energy                ; Max amount of food energy per patch.
  min-reproduce-energy           ; Min energy required for bacteria to reproduce.

  food-growth-rate               ; How fast food is replenished on average.
  food-bacteria-eat              ; Amount of food bacteria eat each time step.
  regrowth-variability           ; Adjusts regrowth rates (see replenish-food).

  virus-replication-rate         ; Number of viruses created in a lytic cycle.

  bacterium-model                ; Stores the bacterium child model for easy access.

  virus-history                  ; Required for plot housekeeping.
                                 ; This can be removed if 1) a primitive to get all
                                 ; current plot pens as a list is added, or 2) a
                                 ; way to remove temporary plot pens without also
                                 ; clearing the plot or that pen's trail is added.
  plot-virus                     ; Required for clean switching on coevolution plot.

  initial-bacteria 
  initial-viruses 
  max-virus-types 
  infection-chance 
  spacer-loss-chance 
  crispr? 
  plotted-virus
]

breed [ foods food ]
breed [ bacteria bacterium ]
breed [ viruses virus ]

viruses-own [ sequence ]
bacteria-own [ energy array ]

patches-own [ food-energy countdown ]

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; SETUP PROCEDURES ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

to setup
  ls:reset
  clear-all

  set food-color     [90 140 90 150]
  set bacteria-color  orange
  set virus-color     violet

  set-default-shape bacteria "bacteria"
  set-default-shape viruses  "virus"
  set-default-shape foods    "food"

  set bacteria-size 1

  set min-reproduce-energy 100
  set sprout-delay-time 25
  set max-food-energy 100
  set food-bacteria-eat 25
  set food-growth-rate 25
  set regrowth-variability 1

  set virus-replication-rate 20

  ls:create-models 1 "CRISPR Bacterium LevelSpace.nlogo"
  set bacterium-model last ls:models

  setup-world
  setup-virus-plot
  reset-ticks
end

to setup-world
  ask patches [
    set food-energy max-food-energy / 2
    set countdown 0
    ; Make patches blue (water colored) and hatch food in water spots
    set pcolor [180 200 230]
    sprout-foods 1 [ set color food-color ]
  ]

  ask patches [ grow-food ]

  create-bacteria initial-bacteria [
    set size bacteria-size
    set color bacteria-color
    set energy random-normal (min-reproduce-energy / 2) (min-reproduce-energy / 10)
    set array []
    random-position
  ]
  create-viruses initial-viruses [
    set size bacteria-size / 2
    set color virus-color
    set sequence random max-virus-types
    random-position
  ]
end

to random-position
  setxy (min-pxcor + random-float (max-pxcor * 2))
        (min-pycor + random-float (max-pycor * 2))
end

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; RUNTIME PROCEDURES ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

to go
  if count bacteria < 1 [ stop ]
  if count viruses < 1 [ stop ]
  bacteria-live
  viruses-live
  ask patches [ replenish-food ]
  update-virus-plot
  tick
end

;----------------------------- BACTERIA PROCEDURES -----------------------------

to bacteria-live
  ask bacteria [
    move-bacteria
    bacteria-eat-food
    reproduce-bacteria
    spacer-loss
    if (energy <= 0 ) [ die ]
  ]
end

to move-bacteria ; Bacteria procedure
  set energy (energy - 1)  ; Bacteria lose energy as they move
  rt random-float 90
  lt random-float 90
  fd 0.25  ; The lower the speed, the less severe the population oscillations are.
end

to bacteria-eat-food ; Bacteria procedure
  ; If there is enough food on this patch, the bacteria eat it and gain energy.
  if food-energy > food-bacteria-eat [
    ; Bacteria gain 1/5 the energy of the food they eat (trophic level assumption)
    set food-energy (food-energy - food-bacteria-eat)
    set energy energy + food-bacteria-eat / 5  ; bacteria gain energy by eating
  ]
  ; If all the food is consumed in a patch, set the countdown timer
  ; to delay when the food will grow back in this patch.
  if food-energy <= food-bacteria-eat [ set countdown sprout-delay-time ]
end

to reproduce-bacteria ; Bacteria procedure
 if (energy >  min-reproduce-energy) [
    set energy (energy / 2)  ; Parent keeps half the cell's energy
    ; Variable inheritance gives the daughter half the cell's energy too
    hatch 1 [
      rt random 360
      fd 0.25
    ]
  ]
end

to spacer-loss ; Bacteria procedure
  if not empty? array and random-float 100 < spacer-loss-chance [
    ; Spacers loss is FIFO and we add to the front of the array.
    set array but-last array
  ]
end

;------------------------------ VIRUS PROCEDURES -------------------------------

to viruses-live
  ask viruses [
    move-virus
    infect
    maybe-degrade
  ]
end

to move-virus
  rt random-float 90
  lt random-float 90
  fd 0.10
end

to infect
  let target one-of bacteria-here
  if (target != nobody) and (random-float 100 < infection-chance) [
    ; First open bacterium child model
    ls:let virus-sequence sequence
    ls:let bacterium-array ifelse-value crispr? [ [array] of target ] [ [] ]
    ls:ask bacterium-model [
      ; Setup initializes the cell with approximately equilibrium levels
      ; of all CRISPR components. The go repeats allow guide-cas9 binding.
      ; Syntax: setup [ crispr-array unbind-% rnap-processivity-% crispr-function-% ]
      setup bacterium-array 5 80 100
      repeat 50 [ go ]
      infect virus-sequence
    ]
    while [ [not done?] ls:of bacterium-model ] [
      ls:ask bacterium-model [ go ]
    ]
    if [virus-dead?] ls:of bacterium-model [ die ]
    if [virus-added?] ls:of bacterium-model [
      ask target [ set array [array] ls:of bacterium-model ]
      die
    ]
    if [dna-infected?] ls:of bacterium-model [
      replicate target
    ]
  ]
end

to replicate [ host ]
  ask host [ die ]
  ; Small chance viruses will mutate when they replicate
  ; As long as sequence is a random int, there is a ~5% chance of mutation
  if random-float 1 < 0.05 [ set sequence random max-virus-types ]
  ; Since the initial virus doesn't die in the model but would IRL, subtract 1.
  hatch virus-replication-rate - 1
end


to maybe-degrade
  if random-float 100 < 1 [ die ]
end

;------------------------------ FOOD PROCEDURES -------------------------------

; Food replenishes every time step (e.g. photosynthesis, etc.)
to replenish-food
  ; To change resource restoration variability do the following:
  ; In setup, set regrowth-variability n
  ; - 1/n chance to regrow this tick
  ; - n times as much regrowth as normal when it happens
  set countdown (countdown - 1)
  ; Fertile patches gain 1 energy unit per turn, up to max-food-energy threshold
  if countdown <= 0 and random regrowth-variability = 0 [
    set food-energy (food-energy + food-growth-rate * regrowth-variability / 10)
    if food-energy > max-food-energy [ set food-energy max-food-energy ]
  ]
  if food-energy < 0 [
    set food-energy 0
    set countdown sprout-delay-time
  ]
  grow-food
end

; Adjust the size of the food to reflect how much food is in that patch
to grow-food
  ask foods-here [
    ifelse food-energy >= 5 [
      set size (food-energy / max-food-energy)
    ] [
      set size (5 / max-food-energy)
    ]
  ]
end

;------------------------------ PLOT PROCEDURES --------------------------------

to setup-virus-plot ; Observer procedure
  set plot-virus plotted-virus
  set-current-plot "Virus Relative Abundance"
  ; Record each existing virus type.
  set virus-history remove-duplicates [sequence] of viruses
  ; Create pens for each existing virus type.
  foreach virus-history [ seq ->
    ; Cast the sequence to a string and use that as the pen's name.
    create-temporary-plot-pen word seq ""
    set-plot-pen-color one-of base-colors + one-of [-2 0 2]
    plotxy 0 (100 * (count viruses with [sequence = seq]) / (max list 1 count viruses))
  ]
end

to update-virus-plot
  set-current-plot "Virus Relative Abundance"
  ; Record any new viruses that may have arisen from mutation.
  set virus-history remove-duplicates sentence ([sequence] of viruses) virus-history
  foreach virus-history [ seq ->
    ; Cast the sequence to a string and use that as the pen's name.
    let pen-name word seq ""
    ; Switch to that pen if it exists, create a new one if it doesn't.
    ifelse plot-pen-exists? pen-name [
      set-current-plot-pen pen-name
    ] [
      create-temporary-plot-pen pen-name
      set-plot-pen-color one-of base-colors + one-of [-2 0 2]
    ]
    ; After setting the appropriate pen as current, plot the next point.
    plotxy (ticks + 1) (100 * (count viruses with [sequence = seq]) / (max list 1 count viruses))
  ]
end

; Called in the 'Plot update commands' block of the histogram plots.
; Adjusts the x and y ranges of the histogram dynamically based on the input data.
to update-histogram-ranges [ input-list interval ]
  ; If the input list is empty, let the plot use its default ranges.
  ; Otherwise, adjust the plot axis ranges to fit the input data.
  if not empty? input-list [
    ; Adjust the x range to include the whole input data set.
    ; The x range expands with the data, but never contracts.
    let plot-upper-bound max list plot-x-max (interval + max input-list)
    let plot-lower-bound min list plot-x-min min input-list
    set-plot-x-range plot-lower-bound plot-upper-bound

    ; Adjust the y range based on the input data, avoiding constant shifts.
    ; Find the max bar height using the mode(s) of the input data.
    let list-modes-unique modes input-list
    let list-modes-enumerated filter [ i -> member? i list-modes-unique ] input-list
    let max-bar-height (length list-modes-enumerated) / (length list-modes-unique)
    ; The y range should be about 150% of the max bar height, within a tolerance.
    let grow-threshold ceiling (1.05 * max-bar-height)  ; Bar > 95% of the y max
    let shrink-threshold floor (2 * max-bar-height)     ; Bar < 50% of the y max
    if (plot-y-max <= grow-threshold) or (plot-y-max >= shrink-threshold) [
      set-plot-y-range 0 ceiling (1.5 * max-bar-height) ; Bar = 67% of the y max
    ]
  ]
end


; Copyright 2019 Uri Wilensky.
; See Info tab for full copyright and license.`,
  `globals [
  max-age               ;; maximum age that all daisies live to
  global-temperature    ;; the average temperature of the patches in the world
  num-blacks            ;; the number of black daisies
  num-whites            ;; the number of white daisies
  scenario-phase        ;; interval counter used to keep track of what portion of scenario is currently occurring
  start-%-whites
  albedo-of-whites
  start-%-blacks
  albedo-of-blacks
  scenario
  solar-luminosity 
  albedo-of-surface
  show-daisies?
  paint-daisies-as 
  show-temp-map?
]

breed [daisies daisy]

patches-own [temperature]  ;; local temperature at this location

daisies-own [
  age       ;; age of the daisy
  albedo    ;; fraction (0-1) of energy absorbed as heat from sunlight
]


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Setup Procedures ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

to setup
  clear-all
  set-default-shape daisies "flower"
  ask patches [ set pcolor gray ]

  set max-age 25
  set global-temperature 0

  if (scenario = "ramp-up-ramp-down"    ) [ set solar-luminosity 0.8 ]
  if (scenario = "low solar luminosity" ) [ set solar-luminosity 0.6 ]
  if (scenario = "our solar luminosity" ) [ set solar-luminosity 1.0 ]
  if (scenario = "high solar luminosity") [ set solar-luminosity 1.4 ]

  seed-blacks-randomly
  seed-whites-randomly
  ask daisies [set age random max-age]
  ask patches [calc-temperature]
  set global-temperature (mean [temperature] of patches)
  update-display
  reset-ticks
end

to seed-blacks-randomly
   ask n-of round ((start-%-blacks * count patches) / 100) patches with [not any? daisies-here]
     [ sprout-daisies 1 [set-as-black] ]
end

to seed-whites-randomly
   ask n-of floor ((start-%-whites * count patches) / 100) patches with [not any? daisies-here]
     [ sprout-daisies 1 [set-as-white] ]
end


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Runtime Procedures ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;


to go
   ask patches [calc-temperature]
   diffuse temperature .5
   ask daisies [check-survivability]
   set global-temperature (mean [temperature] of patches)
   update-display
   tick
   if scenario = "ramp-up-ramp-down" [
     if ticks > 200 and ticks <= 400 [
       set solar-luminosity precision (solar-luminosity + 0.005) 4
     ]
     if ticks > 600 and ticks <= 850 [
       set solar-luminosity precision (solar-luminosity - 0.0025) 4
     ]
   ]
   if scenario = "low solar luminosity"  [ set solar-luminosity 0.6 ]
   if scenario = "our solar luminosity"  [ set solar-luminosity 1.0 ]
   if scenario = "high solar luminosity" [ set solar-luminosity 1.4 ]
end

to set-as-black ;; turtle procedure
  set color black
  set albedo albedo-of-blacks
  set age 0
  set size 0.6
end

to set-as-white  ;; turtle procedure
  set color white
  set albedo albedo-of-whites
  set age 0
  set size 0.6
end

to check-survivability ;; turtle procedure
  let seed-threshold 0
  let not-empty-spaces nobody
  let seeding-place nobody

  set age (age + 1)
  ifelse age < max-age
  [
     set seed-threshold ((0.1457 * temperature) - (0.0032 * (temperature ^ 2)) - 0.6443)
     ;; This equation may look complex, but it is just a parabola.
     ;; This parabola has a peak value of 1 -- the maximum growth factor possible at an optimum
     ;; temperature of 22.5 degrees C
     ;; -- and drops to zero at local temperatures of 5 degrees C and 40 degrees C. [the x-intercepts]
     ;; Thus, growth of new daisies can only occur within this temperature range,
     ;; with decreasing probability of growth new daisies closer to the x-intercepts of the parabolas
     ;; remember, however, that this probability calculation is based on the local temperature.

     if (random-float 1.0 < seed-threshold) [
       set seeding-place one-of neighbors with [not any? daisies-here]

       if (seeding-place != nobody)
       [
         if (color = white)
         [
           ask seeding-place [sprout-daisies 1 [set-as-white]  ]
         ]
         if (color = black)
         [
           ask seeding-place [sprout-daisies 1 [set-as-black]  ]
         ]
       ]
     ]
  ]
  [die]
end

to calc-temperature  ;; patch procedure
  let absorbed-luminosity 0
  let local-heating 0
  ifelse not any? daisies-here
  [   ;; the percentage of absorbed energy is calculated (1 - albedo-of-surface) and then multiplied by the solar-luminosity
      ;; to give a scaled absorbed-luminosity.
    set absorbed-luminosity ((1 - albedo-of-surface) * solar-luminosity)
  ]
  [
      ;; the percentage of absorbed energy is calculated (1 - albedo) and then multiplied by the solar-luminosity
      ;; to give a scaled absorbed-luminosity.
    ask one-of daisies-here
      [set absorbed-luminosity ((1 - albedo) * solar-luminosity)]
  ]
  ;; local-heating is calculated as logarithmic function of solar-luminosity
  ;; where a absorbed-luminosity of 1 yields a local-heating of 80 degrees C
  ;; and an absorbed-luminosity of .5 yields a local-heating of approximately 30 C
  ;; and a absorbed-luminosity of 0.01 yields a local-heating of approximately -273 C
  ifelse absorbed-luminosity > 0
      [set local-heating 72 * ln absorbed-luminosity + 80]
      [set local-heating 80]
  set temperature ((temperature + local-heating) / 2)
     ;; set the temperature at this patch to be the average of the current temperature and the local-heating effect
end

to paint-daisies   ;; daisy painting procedure which uses the mouse location draw daisies when the mouse button is down
  if mouse-down?
  [
    ask patch mouse-xcor mouse-ycor [
      ifelse not any? daisies-here
      [
        if paint-daisies-as = "add black"
          [sprout-daisies 1 [set-as-black]]
        if paint-daisies-as = "add white"
          [sprout-daisies 1 [set-as-white]]
      ]
      [
        if paint-daisies-as = "remove"
          [ask daisies-here [die]]
      ]
      display  ;; update view
    ]
  ]
end

to update-display
  ifelse (show-temp-map? = true)
    [ ask patches [set pcolor scale-color red temperature -50 110] ]  ;; scale color of patches to the local temperature
    [ ask patches [set pcolor grey] ]

  ifelse (show-daisies? = true)
    [ ask daisies [set hidden? false] ]
    [ ask daisies [set hidden? true] ]
end


; Copyright 2006 Uri Wilensky.
; See Info tab for full copyright and license.`,
  `patches-own [ heat ]

globals[ num-turtles diffusion-rate turtle-heat turtle-speed wander? ]

to setup
  clear-all
  set-default-shape turtles "circle"
  create-turtles num-turtles   ; each turtle is like a heat source
  [ setxy random-xcor random-ycor     ; position the turtles randomly
    hide-turtle   ; so we don't see the turtles themselves, just the heat they produce
    set heat turtle-heat ] ; turtles set the patch variable
  recolor-patches                       ; color patches according to heat
  reset-ticks
end

to go
  ask turtles [ set heat turtle-heat ]   ; turtles set the patch variable
  if wander? [ ask turtles [ wander ] ]  ; movement of turtles is controlled by WANDER? switch
  diffuse heat diffusion-rate            ; this causes the "spreading" of heat
  recolor-patches                        ; color patches according to heat
  tick
end

to wander ; turtle procedure
  rt random 50 - random 50
  fd turtle-speed
end

to recolor-patches  ;; color patches according to heat
  ask patches [ set pcolor heat ]
end


; Copyright 1997 Uri Wilensky.
; See Info tab for full copyright and license.`,
  `;;;;;;;;;;;;;;;;;;
;; Declarations ;;
;;;;;;;;;;;;;;;;;;

globals
[
  ;; number of turtles that are sick
  num-sick
  ;; when multiple runs are recorded in the plot, this
  ;; tracks what run number we're on
  run-number
  ;; counter used to keep the model running for a little
  ;; while after the last turtle gets infected
  delay
  num-androids
  infection-chance
  step-size 
  avoid? 
  chase?
]

breed [ androids android ]
breed [ users user ]

;; androids and users are both breeds of turtle, so both androids
;; and users have these variables
turtles-own
[
  infected?    ;; whether turtle is sick (true/false)
]

;;;;;;;;;;;;;;;;;;;;;
;; Setup Functions ;;
;;;;;;;;;;;;;;;;;;;;;

;; clears the plot too
to setup-clear
  clear-all
  set run-number 1
  setup-world
end

;; note that the plot is not cleared so that data
;; can be collected across runs
to setup-keep
  clear-turtles
  clear-patches
  set run-number run-number + 1
  setup-world
end

to setup-world
  set-default-shape androids "android"
  set-default-shape users "person"
  set num-sick 0
  set delay 0
  create-some-androids
  create-user
  reset-ticks
end

to infect
  ask one-of androids [ get-sick ]
end

to create-some-androids
  create-androids num-androids
  [
    setxy random-pxcor random-pycor   ;; put androids on patch centers
    set color gray
    set heading 90 * random 4
    set infected? false
  ]
end

;;;;;;;;;;;;;;;;;;;;;;;
;; Runtime Functions ;;
;;;;;;;;;;;;;;;;;;;;;;;

to go
  ;; in order to extend the plot for a little while
  ;; after all the turtles are infected...
  if num-sick = count turtles
    [ set delay delay + 1  ]
  if delay > 50
    [ stop ]
  ;; now for the main stuff;
  androids-wander
  ask turtles with [ infected? ]
    [ spread-disease ]
  set num-sick count turtles with [ infected? ]
  tick
end

;; controls the motion of the androids
to androids-wander
  ask androids
  [
    ifelse avoid? and not infected?
      [ avoid ] [
    ifelse chase? and infected?
      [ chase ]
      [ rt (random 4) * 90 ] ]
  ]
  ask androids [
    fd 1
  ]
end

to avoid ;; android procedure
  let candidates patches in-radius 1 with [ not any? turtles-here with [ infected? ] ]
  ifelse any? candidates
    [ face one-of candidates ]
    [ rt (random 4) * 90 ]
end

to chase ;; android procedure
  let candidates turtles in-radius 1 with [ not infected? ]
  ifelse any? candidates
    [ face one-of candidates ]
    [ rt (random 4) * 90 ]
end

to spread-disease ;; turtle procedure
  ask other turtles-here [ maybe-get-sick ]
end

to maybe-get-sick ;; turtle procedure
  ;; roll the dice and maybe get sick
  if (not infected?) and (random 100 < infection-chance)
    [ get-sick ]
end

;; set the appropriate variables to make this turtle sick
to get-sick ;; turtle procedure
  if not infected?
  [ set infected? true
  set shape word shape " sick" ]
end

;;;;;;;;;;;;;;;;;;;;;
;; User Procedures ;;
;;;;;;;;;;;;;;;;;;;;;

to create-user
  create-users 1
  [
    set color sky
    set size 1.5     ;; easier to see than default of 1
    set heading (random 4) * 90
    set infected? false
  ]
end

to move [ new-heading ]
  ask users
  [
    set heading new-heading
    fd step-size
  ]
end


; Copyright 2005 Uri Wilensky.
; See Info tab for full copyright and license.`,
  `breed [ rockets rocket ]
breed [ frags frag ]

globals [
  countdown       ; how many ticks to wait before a new salvo of fireworks
  trails?
  max-fireworks
  fragments
  initial-x-vel
  initial-y-vel
  gravity
  fade-amount
]

turtles-own [
  col             ; sets color of an explosion particle
  x-vel           ; x-velocity
  y-vel           ; y-velocity
]

rockets-own [
  terminal-y-vel  ; velocity at which rocket will explode
]

frags-own [
  dim             ; used for fading particles
]

to setup
  clear-all
  set-default-shape turtles "circle"
  reset-ticks
end

; This procedure executes the model. If there are no turtles,
; it will either initiate a new salvo of fireworks by calling
; INIT-ROCKETS or continue to count down if it hasn't reached 0.
; It then calls PROJECTILE-MOTION, which launches and explodes
; any currently existing fireworks.
to go
  if not any? turtles [
    ifelse countdown = 0 [
      init-rockets
      ; use a higher countdown to get a longer pause when trails are drawn
      set countdown ifelse-value trails? [ 30 ] [ 10 ]
    ] [
      ; count down before launching a new salvo
      set countdown countdown - 1
    ]
  ]
  ask turtles [ projectile-motion ]
  tick
end

; This procedure creates a random number of rockets according to the
; slider FIREWORKS and sets all the initial values for each firework.
to init-rockets
  clear-drawing
  create-rockets (random max-fireworks) + 1 [
    setxy random-xcor min-pycor
    set x-vel ((random-float (2 * initial-x-vel)) - (initial-x-vel))
    set y-vel ((random-float initial-y-vel) + initial-y-vel * 2)
    set col one-of base-colors
    set color (col + 2)
    set size 2
    set terminal-y-vel (random-float 4.0) ; at what speed does the rocket explode?
  ]
end

; This function simulates the actual free-fall motion of the turtles.
; If a turtle is a rocket it checks if it has slowed down enough to explode.
to projectile-motion ; turtle procedure
  set y-vel (y-vel - (gravity / 5))
  set heading (atan x-vel y-vel)
  let move-amount (sqrt ((x-vel ^ 2) + (y-vel ^ 2)))
  if not can-move? move-amount [ die ]
  fd (sqrt ((x-vel ^ 2) + (y-vel ^ 2)))

  ifelse (breed = rockets) [
    if (y-vel < terminal-y-vel) [
      explode
      die
    ]
  ] [
    fade
  ]
end

; This is where the explosion is created.
; EXPLODE calls hatch a number of times indicated by the slider FRAGMENTS.
to explode ; turtle procedure
  hatch-frags fragments [
    set dim 0
    rt random 360
    set size 1
    set x-vel (x-vel * .5 + dx + (random-float 2.0) - 1)
    set y-vel (y-vel * .3 + dy + (random-float 2.0) - 1)
    ifelse trails?
      [ pen-down ]
      [ pen-up ]
  ]
end

; This function changes the color of a frag.
; Each frag fades its color by an amount proportional to FADE-AMOUNT.
to fade ; frag procedure
  set dim dim - (fade-amount / 10)
  set color scale-color col dim -5 .5
  if (color < (col - 3.5)) [ die ]
end


; Copyright 1998 Uri Wilensky.
; See Info tab for full copyright and license.`,
  `turtles-own [
  leader    ;; the turtle this turtle is following,
            ;; or nobody if not following
  follower  ;; the turtle that is following this turtle,
            ;; or nobody if not being followed
]

globals [ population near-radius far-radius waver ]

to setup
  clear-all
  create-turtles population
  [ set color magenta
    setxy random-xcor random-ycor
    set leader nobody
    set follower nobody ]
  reset-ticks
end

to go
  ask turtles
  [ if leader = nobody
    [ attach-turtle ] ]
  ask turtles [ turn-turtle ]
  ask turtles [ fd 1 ]
  tick
end

to attach-turtle  ;; turtle procedure
  ;; find a random patch to test inside the donut
  let xd near-radius + random (far-radius - near-radius)
  let yd near-radius + random (far-radius - near-radius)
  if random 2 = 0 [ set xd (- xd) ]
  if random 2 = 0 [ set yd (- yd) ]
  ;; check for free turtles on that patch
  let candidate one-of (turtles-at xd yd) with [follower = nobody]
  ;; if we didn't find a suitable turtle, stop
  if candidate = nobody [ stop ]
  ;; we're all set, so latch on!
  ask candidate [ set follower myself ]
  set leader candidate
  ;; change our color
  ifelse follower = nobody
  [ set color lime ]
  [ set color sky
    set shape "line" ]
  ;; change our leader's color
  ask candidate
  [ ifelse leader = nobody
    [ set color yellow ]
    [ set color sky
      set shape "line" ] ]
end

to turn-turtle  ;; turtle procedure
  ;; if we are still unattached...
  ifelse leader = nobody
  ;; do a somewhat random glide
  [ rt random-float waver - random-float waver ]
  ;; otherwise follow the leader
  [ face leader ]
end


; Copyright 1998 Uri Wilensky.
; See Info tab for full copyright and license.`,
  `extensions [ sound ]

globals [
 chromosomes ; list of all possible chromosomes
 random-who-list ; keeps a shuffled list for pretty-ness
 generations ; number of generations we've seen
 num-chromosomes
 shuffle-parts?
 sound?
 tempo-bpm
 hit-limit
 hit-density-modifier
 num-mutations
 mutation-strength
 soloer
 solo?
]

turtles-own [
  my-chromosomes ; list to hold the chromosomes of a drummer
  my-velocity ; the (int) velocity value of a drummer
  my-instrument ; the (string) instrument for that turtle
  mutation-rate ; variable to control "reproduction"
  hits ; counts the number of drum hits for a turtle across its lifespan
  hits-since-evolve ; the number of hits since a mutation or evolution
]

breed [ low-drums low-drummer ]
breed [ med-drums med-drummer ]
breed [ high-drums high-drummer ]

to setup
  clear-all
  ; Make the view big enough to show 16 rows (each a drummer) and however many 'beats'
  resize-world 0 ((num-chromosomes * 4) - 1) 0 15
  set-globals
  set-initial-turtle-variables
  reset-ticks
  update-view
end

; Procedure to play a pattern with evolution
to go
  ask turtles [ play ]
  ; If we've reached the end of a pattern, do some evolution!
  if (ticks mod (num-chromosomes * 4) = 0) and (ticks != 0) [
    set generations generations + 1
    go-evolve
  ]
  update-view
  tick
  wait 60 / tempo-bpm / 4   ; This roughly sets tempo
end

; Procedure to play a pattern without any evolution
to go-no-evolve
  ask turtles [ play ]
  update-view
  tick
  wait 60 / tempo-bpm / 4
end

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; PLAY FUNCTIONS ;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

to play-my-drum ; turtle procedure
  let temp my-velocity
  if sound? [
    if solo? [ ; If you're a soloer, play out! Otherwise, be quiet!
      ifelse who = soloer [
        set temp my-velocity + 50
      ][
        set temp my-velocity - 50
      ]
   ]
    sound:play-drum my-instrument temp
  ]
end

to play ; turtle procedure
  if item (ticks mod (num-chromosomes * 4)) my-pattern = 1 [
    play-my-drum
    set hits hits + 1
    set hits-since-evolve hits-since-evolve + 1
  ]
end
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; END PLAY FUNCTIONS ;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; EVOLUTION FUNCTIONS ;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

to go-evolve
  ; If there isn't a soloist, ask 2 of each type to evolve
  ifelse not solo? [
    ask n-of 2 low-drums [
      evolve
    ]
    ask n-of 2 med-drums [
      evolve
    ]
    ask n-of 2 high-drums [
      evolve
    ]
    ; If a drummer hasn't changed in a while, mutate
    ask turtles with [hits-since-evolve > hit-limit] [
      mutate
      set hits-since-evolve 0
    ]
  ][ ; If there is a soloist, do the same, but don't include the soloer
    ask n-of 2 low-drums with [ who != soloer ] [
      evolve
    ]
    ask n-of 2 med-drums with [ who != soloer ] [
      evolve
    ]
    ask n-of 2 high-drums with [ who != soloer ]  [
      evolve
    ]

    ; If a drummer hasn't changed in a while, mutate
    ask turtles with [ hits-since-evolve > hit-limit and who != soloer ] [
      mutate
      set hits-since-evolve 0
    ]
  ]
end

to evolve ; turtle procedure
  let mate nobody
  let list-of-fitnesses []
  let search-fitness 0

  if is-low-drummer? self [
    set list-of-fitnesses [ fitness ] of other breed
    set search-fitness select-random-weighted-fitness list-of-fitnesses
    set mate one-of other breed with [ fitness = search-fitness ]
  ]

  if is-med-drummer? self [
    set list-of-fitnesses [ fitness ] of turtles with [ breed != [ breed ] of myself ]
    set search-fitness select-random-weighted-fitness list-of-fitnesses
    set mate one-of turtles with [ (breed != [breed] of myself) and (fitness = search-fitness)]
  ]

  if is-high-drummer? self [
    set list-of-fitnesses [fitness] of other breed
    set search-fitness select-random-weighted-fitness list-of-fitnesses
    set mate one-of other breed with [fitness = search-fitness]
  ]

  let offspring-chromosomes reproduce-with mate

  ask min-one-of other breed with [who != soloer] [fitness] [
    set my-chromosomes offspring-chromosomes
    set hits-since-evolve 0
  ]
end

; This is where the basic genetic algorithm comes in
to-report reproduce-with [ mate ] ; turtle procedure
  ; The asker is 1st Parent while mate is 2nd parent
  let her-chromosomes [ my-chromosomes ] of mate

  ; Pick a random cross-over point
  let crossover-point random length my-chromosomes

  ; Combine the chromosomes
  let baby-chromosomes sentence (sublist my-chromosomes 0 crossover-point) (sublist her-chromosomes crossover-point length her-chromosomes)

  ; Do a little mutation
  let mutation-chance 0
  if is-low-drummer? self [
    set mutation-chance 50
  ]
  if is-med-drummer? self [
    set mutation-chance 25
  ]
  if is-high-drummer? self [
    set mutation-chance 10
  ]

  ; Maybe actually mutate
  if random 100 > mutation-chance [
    set baby-chromosomes mutate-chromosomes baby-chromosomes
  ]
  report baby-chromosomes
end


; FITNESS FUNCTIONS ;;;;;;;;;;;;;;;;;;;;;;;;
; Dependent on breed, because you can lose fitness or gain fitness by fitting to your particular proclivities
to-report fitness ; turtle procedure
  ; Arbitrary 10% window around target density
  let my-fitness 0

  ; Want to be under the hit-density and be on the downbeats
  if is-low-drummer? self [
    set my-fitness downbeat-fitness
    if my-density-fitness > (hit-density-modifier - 0.1) [
      set my-fitness my-fitness / 1.5
    ]
  ]

  ; Want to be at the hit-density and be on the off-beats
  if is-med-drummer? self [
    set my-fitness offbeat-fitness
    if (my-density-fitness < hit-density-modifier - 0.1) or (my-density-fitness > hit-density-modifier + 0.1) [
      set my-fitness my-fitness / 2
    ]
  ]

  ; Want to be above the hit-density and have lots o' clusters
  if is-high-drummer? self [
    set my-fitness offbeat-fitness
    if my-density-fitness < hit-density-modifier + 0.1 [
      set my-fitness my-fitness / 2
    ]
  ]
  ; use add 1 smoothing
  report my-fitness + 1
end

to-report my-density-fitness ; turtle procedure
  report sum my-pattern / length my-pattern
end

to-report cluster-fitness ; turtle procedure
  ; window size at 3
  let i 4
  let cluster-count 0
  while [i <= length my-pattern] [
    if (sum sublist my-pattern (i - 4) i) = 3 [
      set cluster-count cluster-count + 1
    ]
  ]
  ; Lots of clusters relative to the notes I play
  report cluster-count / sum my-pattern * 100
end

to-report offbeat-fitness ; turtle procedure
  let offbeat-count 0
  foreach range length my-pattern [ i ->
    if i mod 2 != 0 [
      if item i my-pattern = 1 [
        set offbeat-count offbeat-count + 1
      ]
    ]
  ]
  if offbeat-count = 0 [ report 0 ]
  ; You want more off-beats and less down-beats
  report offbeat-count / sum my-pattern * 100
end

to-report downbeat-fitness ; turtle procedure
  let downbeat-count 0
  foreach range length my-pattern [ i ->
    if i mod 2 = 0 [
      if item i my-pattern = 1 [
        set downbeat-count downbeat-count + 1
      ]
    ]
  ]

  if downbeat-count = 0 [ report 0 ]
  ; In other words, you want lots of downbeats in comparison to your other notes
  report downbeat-count / sum my-pattern * 100
end

to mutate ; turtle procedure
  set my-chromosomes mutate-chromosomes my-chromosomes
end

; Procedure to mutate a chromosome
to-report mutate-chromosomes [the-chromosomes]
  ; basically picks a chromosome, mutates it, returns a new set
  let new-chromosomes the-chromosomes
  repeat num-mutations [
    let temp random num-chromosomes
    set new-chromosomes replace-item temp new-chromosomes ((round (random-normal (item temp new-chromosomes) mutation-strength)) mod 16)
  ]
  report new-chromosomes
end
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; END EVOLUTION FUNCTIONS ;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; HELPER FUNCTIONS ;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

; Converts a set of chromosomes into a binary rhythm pattern
to-report my-pattern ; turtle Procedure
  let pattern []
  foreach my-chromosomes [ n ->
   set pattern sentence pattern (get-chromosome n)
  ]
  report pattern
end

to set-globals
  set generations 0
  set random-who-list range 16
  ; this is just for looks. we keep a map of who to random-who
  if shuffle-parts? [
    set random-who-list shuffle random-who-list
    set random-who-list shuffle random-who-list
  ]
  set chromosomes []
  ; CHROMOSOME LIBRARY
  let c0 [0 0 0 0]
  let c1 [1 0 0 0]  let c2  [0 1 0 0] let c3 [0 0 1 0] let c4 [0 0 0 1]
  let c5 [1 1 0 0]  let c6  [1 0 1 0] let c7 [1 0 0 1] let c8 [0 1 1 0]
  let c9 [0 1 0 1]  let c10 [0 0 1 1]
  let c11 [1 1 1 0] let c12 [1 0 1 1] let c13 [1 1 0 1] let c14 [0 1 1 1]
  let c15 [1 1 1 1]
  set chromosomes (list c0 c1 c2 c3 c4 c5 c6 c7 c8 c9 c10 c11 c12 c13 c14 c15)
end

to set-initial-turtle-variables
  create-low-drums 6 [
    set my-instrument "Acoustic Bass Drum"
    set my-velocity 50
    set color red
    set mutation-rate 64
  ]

  create-med-drums 5 [
    set my-instrument "Acoustic Snare"
    set color green
    set my-velocity 50
    set mutation-rate 32
  ]

  create-high-drums 5 [
    set my-instrument "Closed Hi Hat"
    set color blue
    set my-velocity 100
    set mutation-rate 16
  ]

  ask turtles [
    set my-chromosomes (n-values num-chromosomes [ 1 ])
    hide-turtle
    set hits 0
  ]
end

; Procedure to update the view (simplified music notation)
to update-view
  ask turtles [
    let column 0
    let row item who random-who-list
    foreach my-pattern [ n ->
      ifelse n = 1 [
        ifelse solo? and (soloer = who) [
          ask patch column row [ set pcolor white ]
        ][
          ask patch column row [ set pcolor [ color ] of myself ]
        ]
      ][
        ask patch column row [ set pcolor black ]
      ]
      set column column + 1
    ]
  ]
  ; color the patches that are currently being played
  ask patches with [ pxcor = (ticks mod (num-chromosomes * 4)) ] [ set pcolor yellow ]
end

; Procedure to get a chromosomes pattern from the library
to-report get-chromosome [ index ]
  report item index chromosomes
end

; This is my version of picking a weighted random turtle
to-report select-random-weighted-fitness [ the-list ]
  let weighted-list []
  foreach the-list [ x ->
    ; add one smoothing
    foreach range round ((x / sum the-list * 100) + 1) [
      set weighted-list fput x weighted-list
    ]
  ]
  report item (random length weighted-list) weighted-list
end


; Copyright 2017 Uri Wilensky.
; See Info tab for full copyright and license.`,
  `globals [
  current-color-sep        ; spread of the colors in the kaleidoscope
  counter
  num-turtles
  color-sep
  shift-direction
  follow-turtle?
  expander
  direction
  max-num
]

turtles-own [
  new?                 ; was the turtle just created?
  type-a?              ; used when turtles with different behaviors are hatched
]

to setup
  clear-all
  ; some of the patterns assume
  ; evenly spaced turtles
  create-ordered-turtles num-turtles
  ask turtles [
    pen-down
    set new? false
    set type-a? false
  ]
  set current-color-sep color-sep
  set counter 0
  reset-ticks
end

to lift-pen
  ask turtles [
    if who >= num-turtles [ die ]
     pen-up
    ]
  clear-patches
end


to restore
  ask turtles [
    if who >= num-turtles [ die ]
     pen-down
    ]
  clear-patches
end

to color-shift
  ifelse shift-direction = "increment"
    [ set current-color-sep (current-color-sep + (random-float 0.001)) ]
    [ set current-color-sep (current-color-sep - (random-float 0.001)) ]
end

; turtles draw circles creating an overall circular design.
to pattern-1    ; turtle procedure
  if new? [
    set color (who / current-color-sep)
     if follow-turtle? [
       if who = (50 + num-turtles) [ pen-down ]
     ]
     right-circle
     left-circle
     die
  ]
  if (who mod 10) = 0 [
    rt direction
    fd 0.5
    if (count turtles + 1) <= max-num [
      hatch 1 [set new? true]
    ]
  ]
end


; Turtles draw a combination of hexagons and octagons, Overall shape determined by num-turtles.
to pattern-2    ; turtle procedure
  if new? [
    ifelse type-a? [
      set color (who / current-color-sep)
      if follow-turtle? [
        if who = (60 + num-turtles) [ pen-down ]
      ]
      hexagon
      die
    ][
      set color (who / current-color-sep)
      if follow-turtle? [
        if who = (50 + num-turtles) [ pen-down ]
      ]
      octagon
      die
    ]
  ]
  ifelse (who mod 2) = 0 [
    rt 1
    fd 1
    if (count turtles + 1) <= max-num [
      hatch 1 [
        set new? true
        set type-a? true
      ]
    ]
  ][
    lt 1
    fd 1
    if (count turtles + 1) <= max-num [
      hatch 1 [
        set new? true
        set type-a? false
      ]
    ]
  ]
end

; Turtles create only pentagons, slight variations in their origin create the overall effect.
to pattern-3    ; turtle procedure
  if new? [
    set color (who / current-color-sep)
    if follow-turtle? [
      if who = (60 + num-turtles) [ pen-down ]
    ]
    pentagon
    die
  ]
  if (who mod 5) = 0 [
    rt direction
    fd 0.5
    if (count turtles + 1) <= max-num [
      hatch 1 [ set new? true ]
    ]
  ]
end

; Turtles draw ninegons and left circles creating an overall circular pattern.
to pattern-4    ; turtle procedure
  if new? [
    ifelse type-a? [
      set color (who / current-color-sep)
      if follow-turtle? [
        if who = (1583 + num-turtles) [ pen-down ]
        if who = (1087 + num-turtles) [ pen-down ]
      ]
      nine-gon
      die
    ][
      set color (who / current-color-sep)
      if follow-turtle? [
        if who = (214 + num-turtles) [ pen-down ]
      ]
      left-circle
      die
    ]
  ]
  ifelse (who mod 3) = 0 [
    rt 1
    if (count turtles + 1) <= max-num [
      hatch 1 [
        set new? true
        set type-a? true
      ]
    ]
  ][
    lt 1
    if (count turtles + 1) <= max-num [
    hatch 1 [
      set new? true
      set type-a? false
    ]
  ]
]
end

; Turtles draw a left square and then die.
to pattern-5    ; turtle procedure
    if new? [
      set color (who / current-color-sep)
      if follow-turtle? [
        if who = (80 + num-turtles) [ pen-down ]
      ]
      left-square
      die
    ]
    if (count turtles + 1) <= max-num [
      hatch 1 [ set new? true ]
    ]
end

; Turtles draw several shapes, however overall design remains circular.
to pattern-6    ; turtle procedure
  if count turtles > max-num [
    if who > max-num [ die ]
     stop
    ]

  if new? [
    ifelse type-a? [
      set color (who / current-color-sep)
      if follow-turtle? [
        if who = (60 + num-turtles) [ pen-down ]
      ]
      pentagon
      hexagon
      left-circle
      die
    ][ set color (who / current-color-sep)
      if follow-turtle? [
        if who = (60 + num-turtles) [ pen-down ]
      ]
      nine-gon
      octagon
      right-circle
      die
    ]
  ]

  if (count turtles + 1) <= max-num [
    hatch 1 [
      set new? true
      set type-a? true
    ]
  ]
  if (count turtles + 1) <= max-num [
    hatch 1 [
      set new? true
      set type-a? false
    ]
  ]
end

; Performs the following procedure 180 times:
; Move forward 1.5 steps and turn right by 2 degrees.
; To see the shape that this function creates,
; try calling it in the command center with one turtle with the pen down.
; A turtle will create a circle heading in the right direction.
to right-circle    ; turtle procedure
  repeat 180 [
    fd 1.5
    rt 2
  ]
end

; Performs the following procedure 180 times:
; Move forward 1.5 steps and turn left by 2 degrees.
; To see the shape that this function creates,
; try calling it in the command center with 0one turtle with the pen down.
; A turtle will create a circle heading in the left direction.
to left-circle    ; turtle procedure
  repeat 180 [
    fd 1.5
    lt 2
  ]
end

; Performs the following procedure 4 times:
; Move forward EXPANDER steps and turn left by 90 degrees.
; To see the shape that this function creates,
; try calling it in the command center with one turtle with the pen down.
; A turtle will create a square heading in the left direction.
to left-square    ; turtle procedure
  repeat 4 [
    fd expander
    lt 90
  ]
end

; Performs the following procedure 3 times:
; Move forward 35 steps and turn right by 120 degrees.
; To see the shape that this function creates,
; try calling it in the command center with one turtle with the pen down.
; A turtle will create a triangle heading in the right direction.
to right-triangle    ; turtle procedure
  repeat 3 [
    fd expander
    rt 120
  ]
end

; Performs the following procedure 8 times:
; Move forward 30 steps and turn right by 45 degrees.
; To see the shape that this function creates,
; try calling it in the command center with one turtle with the pen down.
; A turtle will create an octagon heading in the right direction.
to octagon    ;;turtle procedure
  repeat 8 [
    fd 30
    lt 45
  ]
end

; Performs the following procedure 5 times:
; Move forward 35 steps and turn right by 72 degrees.
; To see the shape that this function creates,
; try calling it in the command center with one turtle with the pen down.
; A turtle will create a pentagon heading in the right direction.
to pentagon    ; turtle procedure
  repeat 5 [
    fd 35
    rt 72
  ]
end

; Performs the following procedure 6 times:
; Move forward 30 steps and turn right by 60 degrees.
; To see the shape that this function creates,
; try calling it in the command center with one turtle with the pen down.
; A turtle will create a hexagon heading in the right direction.
to hexagon    ; turtle procedure
  repeat 6 [
    fd 30
    rt 60
  ]
end

; Performs the following procedure 9 times:
; Move forward 35 steps and turn right by 40 degrees.
; To see the shape that this function creates,
; try calling it in the command center with one turtle with the pen down.
; A turtle will create a nine-gon heading in the right direction.
to nine-gon    ; turtle procedure
  repeat 9 [
    fd 35
    lt 40
  ]
end


; Copyright 1998 Uri Wilensky.
; See Info tab for full copyright and license.`,
  `globals [ curr-color-sep num-turtles color-sep color-shift? increase-color?]   ; spread of the colors in the kaleidoscope

; INITIALIZATION PROCEDURES
to setup
  clear-all
  set-default-shape turtles "circle"
  ; the patterns assume evenly spaced turtles
  create-ordered-turtles num-turtles [ pen-down ]
  set curr-color-sep color-sep
  reset-ticks
end


; RUN-TIME PROCEDURES
; First Pattern
; Turn a bit right, hatch a turtle which draws a circle then dies
to pattern-1
  ask turtles [
    rt 1
    hatch 1 [
      set color 5.375 * ((count turtles - 1) / curr-color-sep) + 10
      right-circle
      die
    ]
  ]
  every 1 [ if color-shift? [ color-shift ] ]
  tick
end

; Second Pattern
; Half our turtles do Pattern 1; the other half do the same,
; except mirrored (they turn left circles)
to pattern-2
  ask turtles [
    ifelse (who mod 2) = 0 [
      rt 1
      hatch 1 [
        set color 5.375 * ((count turtles - 1) / curr-color-sep) + 10
        right-circle
        die
      ]
    ][
      lt 1
      hatch 1 [
        set color 5.375 * ((count turtles - 1) / curr-color-sep) + 10
        left-circle
        die
      ]
    ]
  ]
  every 1 [ if color-shift? [ color-shift ] ]
  tick
end

; Spin a circle, clockwise
to right-circle
  repeat 36 [
    fd 4
    rt 10
  ]
end

; Spin a circle, counterclockwise
to left-circle
  repeat 36 [
    fd 4
    lt 10
  ]
end

; Change curr-color-sep, to increase colors or decrease colors
; and cap the value at the bottom at 1 and at the top at 60
to color-shift
  ifelse increase-color? [
    set curr-color-sep curr-color-sep + random 3
    if curr-color-sep > 60 [ set curr-color-sep 60 ]
  ][
    set curr-color-sep curr-color-sep - random 3
    if curr-color-sep < 1 [ set curr-color-sep 1 ]
  ]
end


; Copyright 1998 Uri Wilensky.
; See Info tab for full copyright and license.`,
  `globals [caption]

;; runs automatically when model is opened
to startup
  set caption ""  ;; otherwise it would start out as 0
end

to illusion-1
  clear-all
  set caption "What color are the circles?"
  set-default-shape turtles "circle"
  ;; make the gray lines
  ask patches with [pxcor mod 5 = 0 or
                    pycor mod 5 = 0]
    [ set pcolor gray ]
  ;; make the circles
  ask patches with [pxcor mod 5 = 0 and
                    pycor mod 5 = 0]
    [ sprout 1
        [ set color white
          set size 1.7 ] ]
  display
end

to illusion-2
  clear-all
  set caption "Are the thick lines parallel?"
  ask patches
    [ set pcolor white ]
  ;; make 2 parallel lines
  ask patches with [abs pycor = 4]
    [ set pcolor black ]
  ;; make diagonal lines that start at the center
  ;; and go to different parts of the world
  create-turtles 60
    [ set heading who * 6
      set color black
      set shape "line"
      set size 100 ]
  ;; make a circle in the center
  create-turtles 1
    [ set color black
      set shape "circle"
      set size 5 ]
  display
end

to illusion-3
  clear-all
  set caption "Are the lines parallel?"
  set-default-shape turtles "square"
  ask patches
    [ set pcolor gray ]
  ;; every fourth patch creates a square, either black or white
  ask patches with [pxcor mod 4 = 0 and
                    pycor mod 4 = 0]
    [ sprout 1
        [ set heading 0
          set size 4.8
          ifelse pxcor mod 8 = 0
            [ set color white ]
            [ set color black ] ] ]
  ;; move every other row over 1 to the right
  ask turtles with [pycor mod 16 = 4]
    [ set xcor xcor + 1 ]
  ;; move every other row over 1 to the left
  ask turtles with [pycor mod 16 = 12 ]
    [ set xcor xcor - 1 ]
  display
end

to illusion-4
  clear-all
  set caption "Which inner circle is bigger?"
  set-default-shape turtles "circle"

  ;; make right figure
  let counter 0
  ask patch -12 0
    [ ;; middle circle
      sprout 1
        [ set color white
          set size 5
          ;; 6 smaller circles around the middle circle
          hatch 6
            [ set size 2.5
              set heading 60 * counter
              fd 4
              set counter counter + 1 ] ] ]
  ;; make left figure
  set counter 0
  ask patch 6 0
    [ ;; middle circle
      sprout 1
        [ set color white
          set size 5
          ;; 6 larger circles around the middle circle
          hatch 6
            [ set size 8
              set heading 60 * counter
              fd 8
              set counter counter + 1 ] ] ]
  display
end

to illusion-5
  clear-all
  set caption "Stare at the dot, then lean forward and back."
  ask patches
    [ set pcolor gray ]
  ;; make the inside circle of diamonds
  ;; use ordered turtles so the circle is evenly spaced
  create-ordered-turtles 32
    [ set size 2
      set shape "diamond1"
      fd 12 ]
  ;; make the outside circle of diamonds
  ;; use ordered turtles so the circle is evenly spaced
  create-ordered-turtles 40
    [ set size 2
      set shape "diamond2"
      fd 15 ]
  ;; make the dot in the middle
  create-turtles 1
    [ set shape "circle"
      set color black ]
  display
end

to illusion-6
  clear-all
  set caption "Feeling queasy?"
  ask patches [
    ;; use RGB colors since ordinary NetLogo colors aren't neon enough
    set pcolor one-of [[30 58 190] [133 10 166]]
    ;; place turtles only on patches where both coordinates are even
    if pxcor mod 2 = 0 and pycor mod 2 = 0 [
      sprout 1 [
        set color [99 187 64]
        set shape "lozenge"
        __set-line-thickness 0.15
        set size 2
        ;; make repeating "wave" pattern of headings
        set heading ((pxcor + pycor) / 3) mod 6 * 30
      ]
    ]
  ]
  display
end

to illusion-7
  clear-all
  set caption "Spirals or circles?"
  ask patches [ set pcolor gray ]
  set-default-shape turtles "square 3"
  create-ordered-turtles 16 [ fd  4 rt 15 ]
  create-ordered-turtles 32 [ fd  8 lt 15 ]
  create-ordered-turtles 46 [ fd 12 rt 15 ]
  create-ordered-turtles 60 [ fd 16 lt 15 ]
  ask turtles [
    set size 1.7
    ifelse who mod 2 = 0
    [ set color black ]
    [ set color white ]
  ]
  display
end


; Copyright 2005 Uri Wilensky.
; See Info tab for full copyright and license.`,
  `globals [ caption num-levers spin-speed f g scale instrument ]

;; runs automatically when model is opened
to startup
  set caption ""  ;; otherwise it would start out as 0
end

to illusion-1
  clear-all
  set caption "What color are the circles?"
  set-default-shape turtles "circle"
  ;; make the gray lines
  ask patches with [pxcor mod 5 = 0 or
                    pycor mod 5 = 0]
    [ set pcolor gray ]
  ;; make the circles
  ask patches with [pxcor mod 5 = 0 and
                    pycor mod 5 = 0]
    [ sprout 1
        [ set color white
          set size 1.7 ] ]
  display
end

to illusion-2
  clear-all
  set caption "Are the thick lines parallel?"
  ask patches
    [ set pcolor white ]
  ;; make 2 parallel lines
  ask patches with [abs pycor = 4]
    [ set pcolor black ]
  ;; make diagonal lines that start at the center
  ;; and go to different parts of the world
  create-turtles 60
    [ set heading who * 6
      set color black
      set shape "line"
      set size 100 ]
  ;; make a circle in the center
  create-turtles 1
    [ set color black
      set shape "circle"
      set size 5 ]
  display
end

to illusion-3
  clear-all
  set caption "Are the lines parallel?"
  set-default-shape turtles "square"
  ask patches
    [ set pcolor gray ]
  ;; every fourth patch creates a square, either black or white
  ask patches with [pxcor mod 4 = 0 and
                    pycor mod 4 = 0]
    [ sprout 1
        [ set heading 0
          set size 4.8
          ifelse pxcor mod 8 = 0
            [ set color white ]
            [ set color black ] ] ]
  ;; move every other row over 1 to the right
  ask turtles with [pycor mod 16 = 4]
    [ set xcor xcor + 1 ]
  ;; move every other row over 1 to the left
  ask turtles with [pycor mod 16 = 12 ]
    [ set xcor xcor - 1 ]
  display
end

to illusion-4
  clear-all
  set caption "Which inner circle is bigger?"
  set-default-shape turtles "circle"

  ;; make right figure
  let counter 0
  ask patch -12 0
    [ ;; middle circle
      sprout 1
        [ set color white
          set size 5
          ;; 6 smaller circles around the middle circle
          hatch 6
            [ set size 2.5
              set heading 60 * counter
              fd 4
              set counter counter + 1 ] ] ]
  ;; make left figure
  set counter 0
  ask patch 6 0
    [ ;; middle circle
      sprout 1
        [ set color white
          set size 5
          ;; 6 larger circles around the middle circle
          hatch 6
            [ set size 8
              set heading 60 * counter
              fd 8
              set counter counter + 1 ] ] ]
  display
end

to illusion-5
  clear-all
  set caption "Stare at the dot, then lean forward and back."
  ask patches
    [ set pcolor gray ]
  ;; make the inside circle of diamonds
  ;; use ordered turtles so the circle is evenly spaced
  create-ordered-turtles 32
    [ set size 2
      set shape "diamond1"
      fd 12 ]
  ;; make the outside circle of diamonds
  ;; use ordered turtles so the circle is evenly spaced
  create-ordered-turtles 40
    [ set size 2
      set shape "diamond2"
      fd 15 ]
  ;; make the dot in the middle
  create-turtles 1
    [ set shape "circle"
      set color black ]
  display
end

to illusion-6
  clear-all
  set caption "Feeling queasy?"
  ask patches [
    ;; use RGB colors since ordinary NetLogo colors aren't neon enough
    set pcolor one-of [[30 58 190] [133 10 166]]
    ;; place turtles only on patches where both coordinates are even
    if pxcor mod 2 = 0 and pycor mod 2 = 0 [
      sprout 1 [
        set color [99 187 64]
        set shape "lozenge"
        __set-line-thickness 0.15
        set size 2
        ;; make repeating "wave" pattern of headings
        set heading ((pxcor + pycor) / 3) mod 6 * 30
      ]
    ]
  ]
  display
end

to illusion-7
  clear-all
  set caption "Spirals or circles?"
  ask patches [ set pcolor gray ]
  set-default-shape turtles "square 3"
  create-ordered-turtles 16 [ fd  4 rt 15 ]
  create-ordered-turtles 32 [ fd  8 lt 15 ]
  create-ordered-turtles 46 [ fd 12 rt 15 ]
  create-ordered-turtles 60 [ fd 16 lt 15 ]
  ask turtles [
    set size 1.7
    ifelse who mod 2 = 0
    [ set color black ]
    [ set color white ]
  ]
  display
end


; Copyright 2005 Uri Wilensky.
; See Info tab for full copyright and license.`,
];
