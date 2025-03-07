require "http/server"
require "json"
require "uuid"
require "uuid/json"
require "./environment"

# Game state and player data structures
class Player
  property id : String
  property name : String
  property x : Float64
  property y : Float64
  property z : Float64
  property rotation_y : Float64
  property rotation_z : Float64
  property hull_integrity : Int32
  property socket : HTTP::WebSocket
  property visual_range : Float64 # How far the player can see
  property travel_mode : String # "subluminal" or "superluminal"
  property travel_speed : Float64 # Current speed factor
  
  def initialize(@name : String, @socket : HTTP::WebSocket)
    @id = UUID.random.to_s
    # Start at a random position near a star
    if Universe.instance.stars.size > 0
      random_star = Universe.instance.stars.sample
      @x = random_star.x + Random.new.rand(-1000.0..1000.0)
      @y = random_star.y + Random.new.rand(-200.0..200.0)
      @z = random_star.z + Random.new.rand(-1000.0..1000.0)
    else
      @x = 0.0
      @y = 0.0
      @z = 0.0
    end
    @rotation_y = 0.0
    @rotation_z = 0.0
    @hull_integrity = 100
    @visual_range = 5000.0 # Default visual range in space units
    @travel_mode = "subluminal"
    @travel_speed = 1.0
  end
  
  def to_json(json : JSON::Builder)
    json.object do
      json.field "id", @id
      json.field "name", @name
      json.field "x", @x
      json.field "y", @y
      json.field "z", @z
      json.field "rotationY", @rotation_y
      json.field "rotationZ", @rotation_z
      json.field "hull", @hull_integrity
      json.field "travelMode", @travel_mode
      json.field "travelSpeed", @travel_speed
    end
  end
  
  # Get all space objects within visual range of this player
  def visible_space_objects : Array(SpaceObject)
    Universe.instance.objects_visible_from(@x, @y, @z)
  end
  
  # Get nearest space object
  def nearest_space_object : {SpaceObject, Float64}?
    objects = Universe.instance.objects.values
    return nil if objects.empty?
    
    nearest_object = objects.first
    nearest_distance = nearest_object.distance_to(@x, @y, @z)
    
    objects.each do |object|
      distance = object.distance_to(@x, @y, @z)
      if distance < nearest_distance
        nearest_object = object
        nearest_distance = distance
      end
    end
    
    {nearest_object, nearest_distance}
  end
  
  # Set travel mode (affects speed and maneuverability)
  def set_travel_mode(mode : String)
    @travel_mode = mode
    case mode
    when "superluminal"
      @travel_speed = 100.0 # Much faster for interstellar travel
    when "subluminal"
      @travel_speed = 1.0 # Normal speed for system travel
    end
  end
end

class GameState
  property players : Hash(String, Player)
  
  def initialize
    @players = {} of String => Player
  end
  
  def add_player(player : Player)
    @players[player.id] = player
    puts "Player added: #{player.name} (#{player.id}) at position (#{player.x}, #{player.y}, #{player.z})"
  end
  
  def remove_player(id : String)
    if player = @players[id]?
      puts "Removing player: #{player.name} (#{id})"
      @players.delete(id)
    end
  end
  
  def broadcast_game_state
    @players.each_value do |player|
      send_game_state_to_player(player)
    end
  end
  
  def send_game_state_to_player(player : Player)
    # Gather all visible objects for this player
    visible_objects = player.visible_space_objects
    
    # Get all other players
    other_players = @players.values.select { |p| p.id != player.id }
    
    # Create state message
    state_message = {
      "type" => "game_state",
      "data" => {
        "players" => other_players.map do |p|
          {
            "id" => p.id,
            "name" => p.name,
            "x" => p.x,
            "y" => p.y,
            "z" => p.z,
            "rotationY" => p.rotation_y,
            "rotationZ" => p.rotation_z,
            "hull" => p.hull_integrity,
            "travelMode" => p.travel_mode
          }
        end,
        "spaceObjects" => visible_objects.map do |obj|
          {
            "id" => obj.id,
            "name" => obj.name,
            "type" => obj.object_type,
            "x" => obj.x,
            "y" => obj.y,
            "z" => obj.z,
            "radius" => obj.radius,
            "color" => obj.color,
            "emission" => obj.emission,
            "emissionColor" => obj.emission_color,
            "emissionIntensity" => obj.emission_intensity
          }
        end,
        "nebulaInfo" => {
          "density" => Universe.instance.nebula_density,
          "color" => Universe.instance.nebula_color
        }
      }
    }.to_json
    
    begin
      player.socket.send(state_message)
    rescue ex
      puts "Error sending to player #{player.id}: #{ex.message}"
      # Mark for removal in the next update
      spawn { remove_player(player.id) }
    end
  end
  
  def send_environment_details_to_player(player : Player)
    # Send detailed information about the universe
    universe_info = {
      "type" => "universe_info",
      "data" => {
        "universe_size" => Universe.instance.universe_size,
        "visual_range" => player.visual_range,
        "nebula_density" => Universe.instance.nebula_density,
        "nebula_color" => Universe.instance.nebula_color,
        "player_position" => {
          "x" => player.x,
          "y" => player.y,
          "z" => player.z
        }
      }
    }.to_json
    
    begin
      player.socket.send(universe_info)
    rescue ex
      puts "Error sending universe info to player #{player.id}: #{ex.message}"
    end
  end
  
  def handle_collision(player_id : String)
    if player = @players[player_id]?
      # Simulate damage from collision
      player.hull_integrity -= 10
      if player.hull_integrity < 0
        player.hull_integrity = 0
      end
      
      # Send damage update to the player
      damage_message = {
        "type" => "ship_damage",
        "data" => {
          "hull" => player.hull_integrity
        }
      }.to_json
      
      begin
        player.socket.send(damage_message)
      rescue ex
        puts "Error sending damage update to player #{player_id}: #{ex.message}"
      end
    end
  end
end

# Initialize game state and universe
game_state = GameState.new
universe = Universe.instance
universe.generate_universe(star_count: 50) # Generate 50 star systems

puts "Universe generated with:"
puts "- #{universe.stars.size} stars"
puts "- #{universe.objects.size} total objects"

# Setup WebSocket handler
ws_handler = HTTP::WebSocketHandler.new do |ws, ctx|
  player_id = ""
  
  ws.on_message do |message|
    puts "Received message: #{message}"
    begin
      data = JSON.parse(message)
      
      case data["type"].as_s
      when "join"
        player_name = data["name"].as_s
        player = Player.new(player_name, ws)
        player_id = player.id
        game_state.add_player(player)
        
        # Welcome message with player ID
        welcome_message = {
          "type" => "welcome",
          "data" => {
            "id" => player.id,
            "message" => "Welcome to the game, #{player_name}!",
            "position" => {
              "x" => player.x,
              "y" => player.y,
              "z" => player.z
            }
          }
        }.to_json
        
        ws.send(welcome_message)
        puts "Player joined: #{player_name} (#{player_id})"
        
        # Send initial environment data to the player
        game_state.send_environment_details_to_player(player)
        
        # Send initial visible objects
        game_state.send_game_state_to_player(player)
        
      when "position"
        if player = game_state.players[player_id]?
          # Previous position for distance calculation
          prev_x = player.x
          prev_y = player.y
          prev_z = player.z
          
          # Update position
          player.x = data["x"].as_f
          player.y = data["y"].as_f
          player.z = data["z"].as_f
          player.rotation_y = data["rotationY"].as_f
          player.rotation_z = data["rotationZ"].as_f
          
          # Calculate distance moved
          distance_moved = Math.sqrt((player.x - prev_x)**2 + (player.y - prev_y)**2 + (player.z - prev_z)**2)
          
          # If player moved significantly, send updated space objects
          if distance_moved > player.visual_range / 10
            game_state.send_game_state_to_player(player)
          end
        end
        
      when "travel_mode"
        if player = game_state.players[player_id]?
          mode = data["mode"].as_s
          if ["subluminal", "superluminal"].includes?(mode)
            player.set_travel_mode(mode)
            
            # Send confirmation to player
            travel_message = {
              "type" => "travel_mode_change",
              "data" => {
                "mode" => mode,
                "speed" => player.travel_speed
              }
            }.to_json
            
            ws.send(travel_message)
          end
        end
        
      when "scan_area"
        if player = game_state.players[player_id]?
          # Send detailed information about nearby objects
          nearest = player.nearest_space_object
          
          if nearest
            object, distance = nearest
            
            scan_message = {
              "type" => "scan_result",
              "data" => {
                "nearestObject" => {
                  "id" => object.id,
                  "name" => object.name,
                  "type" => object.object_type,
                  "distance" => distance,
                  "details" => object.to_json
                }
              }
            }.to_json
            
            ws.send(scan_message)
          end
        end
      end
    rescue e
      puts "Error processing message: #{e.message}"
    end
  end
  
  ws.on_close do
    puts "WebSocket closed for player: #{player_id}"
    game_state.remove_player(player_id)
  end
end

# Setup file server handler
static_handler = HTTP::StaticFileHandler.new("./public", directory_listing: false)

# Set up the HTTP server
server = HTTP::Server.new do |context|
  puts "Received request: #{context.request.method} #{context.request.path}"
  
  if context.request.path == "/game"
    # Handle WebSocket connections
    ws_handler.call(context)
  else
    # Handle HTTP requests
    static_handler.call(context)
  end
end

# Set up a simulation loop in a separate fiber
spawn do
  loop do
    begin
      # Update the universe (orbital mechanics, asteroid movement, etc.)
      universe.update(delta_time: 0.1)
      
      # Check for collisions between players
      players = game_state.players.values
      
      # Very basic collision detection - check for proximity between ships
      players.each do |player1|
        players.each do |player2|
          next if player1.id == player2.id
          
          # Calculate distance between ships
          distance = Math.sqrt(
            (player1.x - player2.x) ** 2 +
            (player1.y - player2.y) ** 2 +
            (player1.z - player2.z) ** 2
          )
          
          # If ships are too close, handle collision
          if distance < 3.0
            game_state.handle_collision(player1.id)
            game_state.handle_collision(player2.id)
          end
        end
        
        # Check for collisions with space objects
        Universe.instance.objects.each_value do |object|
          # Skip objects that are not physical (like nebula clouds)
          next if object.object_type == "nebula"
          
          # Calculate distance between player and object
          distance = object.distance_to(player1.x, player1.y, player1.z)
          
          # If player is too close to the object, handle collision
          if distance < object.radius + 2.0
            game_state.handle_collision(player1.id)
          end
        end
      end
      
      # Broadcast game state to all players (now individually handled in send_game_state_to_player)
      game_state.broadcast_game_state
      
      # Update at 10 FPS
      sleep 0.1
    rescue ex
      puts "Error in game loop: #{ex.message}"
    end
  end
end

# Start the server
address = server.bind_tcp "0.0.0.0", 3333
puts "Server listening on http://#{address}"
server.listen