require "json"
require "uuid"
require "random"

# Base class for all space objects
abstract class SpaceObject
  property id : String
  property name : String
  property object_type : String
  property x : Float64
  property y : Float64
  property z : Float64
  property radius : Float64
  property color : String
  property emission : Bool
  property emission_color : String
  property emission_intensity : Float64
  
  def initialize(@name : String, @object_type : String, @x : Float64, @y : Float64, @z : Float64, 
                @radius : Float64, @color : String, @emission : Bool = false, 
                @emission_color : String = "#ffffff", @emission_intensity : Float64 = 0.0)
    @id = UUID.random.to_s
  end
  
  def distance_to(other_x : Float64, other_y : Float64, other_z : Float64) : Float64
    Math.sqrt((@x - other_x)**2 + (@y - other_y)**2 + (@z - other_z)**2)
  end
  
  def within_range?(other_x : Float64, other_y : Float64, other_z : Float64, range : Float64) : Bool
    distance_to(other_x, other_y, other_z) <= range
  end
  
  def to_json(json : JSON::Builder)
    json.object do
      json.field "id", @id
      json.field "name", @name
      json.field "type", @object_type
      json.field "x", @x
      json.field "y", @y
      json.field "z", @z
      json.field "radius", @radius
      json.field "color", @color
      json.field "emission", @emission
      json.field "emissionColor", @emission_color
      json.field "emissionIntensity", @emission_intensity
    end
  end
end

# Star class - a primary light source in the universe
class Star < SpaceObject
  property temperature : Int32
  property planets : Array(Planet)
  
  def initialize(name : String, x : Float64, y : Float64, z : Float64, 
               radius : Float64, @temperature : Int32)
    # Set color based on temperature (simplified stellar classification)
    color = case temperature
            when 0..3700    then "#ff4500" # M - Red
            when 3701..5200 then "#ffa500" # K - Orange
            when 5201..6000 then "#ffff00" # G - Yellow (Sun-like)
            when 6001..7500 then "#ffffff" # F - White
            when 7501..10000 then "#a0c8ff" # A - Blue-white
            when 10001..30000 then "#4169e1" # B - Blue
            else                 "#8a2be2" # O - Purple/Violet
            end
    
    emission_intensity = temperature / 5000.0 # Brighter for hotter stars
    super(name, "star", x, y, z, radius, color, true, color, emission_intensity)
    @planets = [] of Planet
  end
  
  def add_planet(planet : Planet)
    @planets << planet
    planet
  end
  
  def to_json(json : JSON::Builder)
    json.object do
      json.field "id", @id
      json.field "name", @name
      json.field "type", @object_type
      json.field "x", @x
      json.field "y", @y
      json.field "z", @z
      json.field "radius", @radius
      json.field "color", @color
      json.field "emission", @emission
      json.field "emissionColor", @emission_color
      json.field "emissionIntensity", @emission_intensity
      json.field "temperature", @temperature
      json.field "planetCount", @planets.size
    end
  end
end

# Planet class - orbits around a star
class Planet < SpaceObject
  property orbit_radius : Float64
  property orbit_speed : Float64
  property orbit_angle : Float64
  property star_id : String
  property moons : Array(Moon)
  property has_rings : Bool
  property rings_inner_radius : Float64
  property rings_outer_radius : Float64
  property rings_color : String
  
  def initialize(name : String, @star_id : String, @orbit_radius : Float64, 
                radius : Float64, color : String, @orbit_speed : Float64, 
                @has_rings : Bool = false, @rings_inner_radius : Float64 = 0.0,
                @rings_outer_radius : Float64 = 0.0, @rings_color : String = "#cccccc")
    @orbit_angle = Random.new.rand(0.0..Math::PI*2)
    # Calculate position based on star position and orbit
    star = Universe.instance.get_object_by_id(@star_id).as(Star)
    x = star.x + Math.cos(@orbit_angle) * @orbit_radius
    y = star.y
    z = star.z + Math.sin(@orbit_angle) * @orbit_radius
    
    super(name, "planet", x, y, z, radius, color)
    @moons = [] of Moon
  end
  
  def add_moon(moon : Moon)
    @moons << moon
    moon
  end
  
  def update_position(delta_time : Float64)
    # Update orbit angle based on speed
    @orbit_angle += @orbit_speed * delta_time
    if @orbit_angle > Math::PI * 2
      @orbit_angle -= Math::PI * 2
    end
    
    # Get parent star
    if star = Universe.instance.get_object_by_id(@star_id)
      # Update position based on orbit
      @x = star.x + Math.cos(@orbit_angle) * @orbit_radius
      @z = star.z + Math.sin(@orbit_angle) * @orbit_radius
      # y remains the same (orbital plane is level)
    end
    
    # Update moons
    @moons.each do |moon|
      moon.update_position(delta_time)
    end
  end
  
  def to_json(json : JSON::Builder)
    json.object do
      json.field "id", @id
      json.field "name", @name
      json.field "type", @object_type
      json.field "x", @x
      json.field "y", @y
      json.field "z", @z
      json.field "radius", @radius
      json.field "color", @color
      json.field "starId", @star_id
      json.field "orbitRadius", @orbit_radius
      json.field "orbitSpeed", @orbit_speed
      json.field "moonCount", @moons.size
      json.field "hasRings", @has_rings
      
      if @has_rings
        json.field "ringsInnerRadius", @rings_inner_radius
        json.field "ringsOuterRadius", @rings_outer_radius
        json.field "ringsColor", @rings_color
      end
    end
  end
end

# Moon class - orbits around a planet
class Moon < SpaceObject
  property orbit_radius : Float64
  property orbit_speed : Float64
  property orbit_angle : Float64
  property planet_id : String
  
  def initialize(name : String, @planet_id : String, @orbit_radius : Float64, 
                radius : Float64, color : String, @orbit_speed : Float64)
    @orbit_angle = Random.new.rand(0.0..Math::PI*2)
    # Calculate position based on planet position and orbit
    planet = Universe.instance.get_object_by_id(@planet_id).as(Planet)
    x = planet.x + Math.cos(@orbit_angle) * @orbit_radius
    y = planet.y
    z = planet.z + Math.sin(@orbit_angle) * @orbit_radius
    
    super(name, "moon", x, y, z, radius, color)
  end
  
  def update_position(delta_time : Float64)
    # Update orbit angle based on speed
    @orbit_angle += @orbit_speed * delta_time
    if @orbit_angle > Math::PI * 2
      @orbit_angle -= Math::PI * 2
    end
    
    # Get parent planet
    if planet = Universe.instance.get_object_by_id(@planet_id)
      # Update position based on orbit
      @x = planet.x + Math.cos(@orbit_angle) * @orbit_radius
      @z = planet.z + Math.sin(@orbit_angle) * @orbit_radius
      # y remains the same (orbital plane is level)
    end
  end
  
  def to_json(json : JSON::Builder)
    json.object do
      json.field "id", @id
      json.field "name", @name
      json.field "type", @object_type
      json.field "x", @x
      json.field "y", @y
      json.field "z", @z
      json.field "radius", @radius
      json.field "color", @color
      json.field "planetId", @planet_id
      json.field "orbitRadius", @orbit_radius
      json.field "orbitSpeed", @orbit_speed
    end
  end
end

# Asteroid class - free-floating space debris
class Asteroid < SpaceObject
  property velocity_x : Float64
  property velocity_y : Float64
  property velocity_z : Float64
  property rotation_speed : Float64
  
  def initialize(name : String, x : Float64, y : Float64, z : Float64, 
               radius : Float64, color : String, 
               @velocity_x : Float64, @velocity_y : Float64, @velocity_z : Float64,
               @rotation_speed : Float64)
    super(name, "asteroid", x, y, z, radius, color)
  end
  
  def update_position(delta_time : Float64)
    @x += @velocity_x * delta_time
    @y += @velocity_y * delta_time
    @z += @velocity_z * delta_time
  end
  
  def to_json(json : JSON::Builder)
    json.object do
      json.field "id", @id
      json.field "name", @name
      json.field "type", @object_type
      json.field "x", @x
      json.field "y", @y
      json.field "z", @z
      json.field "radius", @radius
      json.field "color", @color
      json.field "velocityX", @velocity_x
      json.field "velocityY", @velocity_y
      json.field "velocityZ", @velocity_z
      json.field "rotationSpeed", @rotation_speed
    end
  end
end

# NebulaCloud class - decorative gas clouds
class NebulaCloud < SpaceObject
  property opacity : Float64
  property cloud_type : String # "dust", "emission", "reflection"
  
  def initialize(name : String, x : Float64, y : Float64, z : Float64, 
               radius : Float64, color : String, @opacity : Float64, @cloud_type : String,
               emission : Bool = false, emission_color : String = "#ffffff", 
               emission_intensity : Float64 = 0.0)
    super(name, "nebula", x, y, z, radius, color, emission, emission_color, emission_intensity)
  end
  
  def to_json(json : JSON::Builder)
    json.object do
      json.field "id", @id
      json.field "name", @name
      json.field "type", @object_type
      json.field "x", @x
      json.field "y", @y
      json.field "z", @z
      json.field "radius", @radius
      json.field "color", @color
      json.field "opacity", @opacity
      json.field "cloudType", @cloud_type
      json.field "emission", @emission
      json.field "emissionColor", @emission_color
      json.field "emissionIntensity", @emission_intensity
    end
  end
end

# SpaceStation class - player-built or NPC structures
class SpaceStation < SpaceObject
  property station_type : String # "trading", "military", "science", etc.
  
  def initialize(name : String, x : Float64, y : Float64, z : Float64, 
               radius : Float64, @station_type : String)
    color = case station_type
            when "trading"  then "#FFD700" # Gold
            when "military" then "#B22222" # Firebrick red
            when "science"  then "#4682B4" # Steel blue
            else                "#CCCCCC" # Light grey
            end
    
    super(name, "station", x, y, z, radius, color, true, "#FFFFFF", 0.5)
  end
  
  def to_json(json : JSON::Builder)
    json.object do
      json.field "id", @id
      json.field "name", @name
      json.field "type", @object_type
      json.field "x", @x
      json.field "y", @y
      json.field "z", @z
      json.field "radius", @radius
      json.field "color", @color
      json.field "stationType", @station_type
      json.field "emission", @emission
      json.field "emissionColor", @emission_color
      json.field "emissionIntensity", @emission_intensity
    end
  end
end

# Class to manage all space objects in the universe
class Universe
  # Singleton pattern
  @@instance : Universe?
  
  def self.instance
    @@instance ||= Universe.new
  end
  
  property objects : Hash(String, SpaceObject)
  property nebula_density : Float64
  property nebula_color : String
  property visual_range : Float64
  property universe_size : Float64
  property stars : Array(Star)
  property nebula_clouds : Array(NebulaCloud)
  property asteroids : Array(Asteroid)
  property space_stations : Array(SpaceStation)
  
  def initialize
    @objects = {} of String => SpaceObject
    @stars = [] of Star
    @nebula_clouds = [] of NebulaCloud
    @asteroids = [] of Asteroid
    @space_stations = [] of SpaceStation
    @nebula_density = 0.5
    @nebula_color = "#4A4A8A" # Bluish-purple
    @visual_range = 5000.0
    @universe_size = 100000.0
  end
  
  def add_object(object : SpaceObject)
    @objects[object.id] = object
    
    case object
    when Star
      @stars << object
    when NebulaCloud
      @nebula_clouds << object
    when Asteroid
      @asteroids << object
    when SpaceStation
      @space_stations << object
    end
    
    object
  end
  
  def get_object_by_id(id : String) : SpaceObject?
    @objects[id]?
  end
  
  def get_nearest_objects(x : Float64, y : Float64, z : Float64, max_distance : Float64) : Array(SpaceObject)
    @objects.values.select do |object|
      object.within_range?(x, y, z, max_distance)
    end
  end
  
  def update(delta_time : Float64)
    @objects.each_value do |object|
      case object
      when Planet
        object.update_position(delta_time)
      when Moon
        object.update_position(delta_time)
      when Asteroid
        object.update_position(delta_time)
      end
    end
  end
  
  def objects_visible_from(x : Float64, y : Float64, z : Float64) : Array(SpaceObject)
    get_nearest_objects(x, y, z, @visual_range)
  end
  
  def to_json
    {
      "nebulaDensity" => @nebula_density,
      "nebulaColor" => @nebula_color,
      "universeSize" => @universe_size,
      "starCount" => @stars.size,
      "nebulaCloudCount" => @nebula_clouds.size,
      "asteroidCount" => @asteroids.size,
      "spaceStationCount" => @space_stations.size
    }.to_json
  end
  
  # Generate a complete universe
  def generate_universe(star_count : Int32 = 50)
    # Clear existing objects
    @objects.clear
    @stars.clear
    @nebula_clouds.clear
    @asteroids.clear
    @space_stations.clear
    
    # Generate stars and their planetary systems
    star_count.times do |i|
      # Position stars throughout the universe with some clustering
      cluster_center_x = Random.new.rand(-@universe_size/2..@universe_size/2)
      cluster_center_z = Random.new.rand(-@universe_size/2..@universe_size/2)
      cluster_y = Random.new.rand(-@universe_size/10..@universe_size/10) # Flatter universe
      
      cluster_size = @universe_size / 20
      
      # Add 1-3 stars per cluster
      stars_in_cluster = Random.new.rand(1..3)
      
      stars_in_cluster.times do |j|
        # Position within cluster
        star_x = cluster_center_x + Random.new.rand(-cluster_size..cluster_size)
        star_y = cluster_y + Random.new.rand(-cluster_size/10..cluster_size/10)
        star_z = cluster_center_z + Random.new.rand(-cluster_size..cluster_size)
        
        # Star properties
        star_temp = Random.new.rand(2500..30000)
        star_size = 50.0 + (star_temp / 30000.0) * 200.0 # Hotter stars are bigger
        
        # Name convention: Greek letter + constellation + number
        greek_letters = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta", "Iota", "Kappa"]
        constellations = ["Centauri", "Orionis", "Cygni", "Draconis", "Lyrae", "Aquilae", "Hydrae", "Pegasi", "Tauri", "Crucis"]
        
        star_name = "#{greek_letters.sample} #{constellations.sample} #{i+j+1}"
        
        # Create the star
        star = Star.new(star_name, star_x, star_y, star_z, star_size, star_temp)
        add_object(star)
        
        # Generate planets for this star
        planet_count = Random.new.rand(0..8) # 0-8 planets per star
        
        # Planet distances from star (in consistent units)
        min_orbit = star_size * 4 # Closest orbit is 4x star radius
        max_orbit = star_size * 50 # Furthest orbit is 50x star radius
        
        planet_count.times do |k|
          # Calculate orbit with some spacing between planets
          orbit_radius = min_orbit + (k + 1) * ((max_orbit - min_orbit) / (planet_count + 1))
          
          # Planet properties
          planet_radius = Random.new.rand(5.0..40.0)
          
          # Planet colors - various earth-like and gas giant colors
          planet_colors = ["#3D550C", "#81B622", "#ECF87F", "#1E81B0", "#76B0C5", "#E28743", "#873e23", "#eeeeff", "#b59f00"]
          planet_color = planet_colors.sample
          
          # Orbit speed (further planets move slower)
          orbit_speed = 0.1 * (1.0 / Math.sqrt(orbit_radius))
          
          # Rings (only for larger planets with ~15% probability)
          has_rings = planet_radius > 20 && Random.new.rand < 0.15
          rings_inner = planet_radius * 1.5
          rings_outer = planet_radius * 3.0
          rings_color = "#dddddd"
          
          # Create the planet
          planet = Planet.new("#{star_name} #{k+1}", star.id, orbit_radius, planet_radius, 
                             planet_color, orbit_speed, has_rings, rings_inner, rings_outer, rings_color)
          add_object(planet)
          star.add_planet(planet)
          
          # Add moons to this planet (more moons for larger planets)
          moon_count = (planet_radius / 10).to_i
          
          moon_count.times do |m|
            # Moon properties
            moon_radius = planet_radius * Random.new.rand(0.1..0.3)
            moon_orbit = planet_radius * Random.new.rand(2.0..5.0)
            moon_speed = 0.5 * (1.0 / Math.sqrt(moon_orbit)) # Moons move faster than planets
            moon_color = "#C8C8C8" # Greyish
            
            # Create the moon
            moon = Moon.new("#{star_name} #{k+1}.#{m+1}", planet.id, moon_orbit, moon_radius, moon_color, moon_speed)
            add_object(moon)
            planet.add_moon(moon)
          end
        end
      end
    end
    
    # Add nebula clouds
    cloud_count = (star_count * 3).to_i
    cloud_count.times do |i|
      # Position clouds throughout the universe
      cloud_x = Random.new.rand(-@universe_size/2..@universe_size/2)
      cloud_y = Random.new.rand(-@universe_size/4..@universe_size/4)
      cloud_z = Random.new.rand(-@universe_size/2..@universe_size/2)
      
      # Cloud properties
      cloud_radius = Random.new.rand(100.0..1000.0)
      cloud_opacity = Random.new.rand(0.1..0.7)
      
      # Cloud types and colors
      cloud_types = ["dust", "emission", "reflection"]
      cloud_type = cloud_types.sample
      
      cloud_colors = {
        "dust" => ["#8A2BE2", "#9370DB", "#7B68EE", "#6A5ACD"], # Purple/blue colors
        "emission" => ["#FF6347", "#FF4500", "#FF8C00", "#FFA500"], # Red/orange colors
        "reflection" => ["#4682B4", "#1E90FF", "#00BFFF", "#87CEEB"]  # Blue colors
      }
      
      cloud_color = cloud_colors[cloud_type].sample
      
      # Emission properties
      is_emissive = cloud_type == "emission"
      emission_color = is_emissive ? cloud_color : "#ffffff"
      emission_intensity = is_emissive ? Random.new.rand(0.2..0.8) : 0.0
      
      # Create the nebula cloud
      cloud = NebulaCloud.new("Nebula Cloud #{i+1}", cloud_x, cloud_y, cloud_z, cloud_radius, 
                             cloud_color, cloud_opacity, cloud_type, is_emissive, emission_color, emission_intensity)
      add_object(cloud)
    end
    
    # Add asteroid fields (between stars)
    asteroid_count = (star_count * 20).to_i
    asteroid_count.times do |i|
      # Position asteroids throughout the universe, but more concentrated in asteroid fields
      if Random.new.rand < 0.7
        # Part of an asteroid field
        field_center_x = Random.new.rand(-@universe_size/2..@universe_size/2)
        field_center_y = Random.new.rand(-@universe_size/4..@universe_size/4)
        field_center_z = Random.new.rand(-@universe_size/2..@universe_size/2)
        
        field_size = @universe_size / 50
        
        asteroid_x = field_center_x + Random.new.rand(-field_size..field_size)
        asteroid_y = field_center_y + Random.new.rand(-field_size/2..field_size/2)
        asteroid_z = field_center_z + Random.new.rand(-field_size..field_size)
      else
        # Scattered asteroid
        asteroid_x = Random.new.rand(-@universe_size/2..@universe_size/2)
        asteroid_y = Random.new.rand(-@universe_size/4..@universe_size/4)
        asteroid_z = Random.new.rand(-@universe_size/2..@universe_size/2)
      end
      
      # Asteroid properties
      asteroid_radius = Random.new.rand(1.0..15.0)
      asteroid_color = ["#8B4513", "#A0522D", "#CD853F", "#D2B48C", "#BC8F8F"].sample # Brownish
      
      # Movement
      velocity_scale = 10.0
      asteroid_vel_x = Random.new.rand(-velocity_scale..velocity_scale)
      asteroid_vel_y = Random.new.rand(-velocity_scale/2..velocity_scale/2)
      asteroid_vel_z = Random.new.rand(-velocity_scale..velocity_scale)
      asteroid_rotation = Random.new.rand(0.1..1.0)
      
      # Create the asteroid
      asteroid = Asteroid.new("Asteroid #{i+1}", asteroid_x, asteroid_y, asteroid_z, asteroid_radius, 
                             asteroid_color, asteroid_vel_x, asteroid_vel_y, asteroid_vel_z, asteroid_rotation)
      add_object(asteroid)
    end
    
    # Add space stations (near stars)
    station_count = (star_count / 5).to_i
    station_count = 1 if station_count < 1 # At least one station
    
    station_count.times do |i|
      # Choose a random star to place the station near
      if @stars.size > 0
        star = @stars.sample
        
        # Position near the star, but not too close
        min_distance = star.radius * 10
        max_distance = star.radius * 20
        
        distance = Random.new.rand(min_distance..max_distance)
        angle = Random.new.rand(0.0..Math::PI*2)
        
        station_x = star.x + Math.cos(angle) * distance
        station_y = star.y + Random.new.rand(-distance/5..distance/5)
        station_z = star.z + Math.sin(angle) * distance
        
        # Station properties
        station_radius = Random.new.rand(20.0..50.0)
        station_types = ["trading", "military", "science"]
        station_type = station_types.sample
        
        # Name based on star and function
        station_name = case station_type
                      when "trading" then "#{star.name} Trading Post"
                      when "military" then "#{star.name} Defense Outpost"
                      when "science" then "#{star.name} Research Station"
                      else "#{star.name} Station"
                      end
        
        # Create the station
        station = SpaceStation.new(station_name, station_x, station_y, station_z, station_radius, station_type)
        add_object(station)
      end
    end
  end
end