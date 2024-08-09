class CalendarForm < ActiveModelSerializers::Model
  attr_accessor :cell_background_color, :weekend_background_color, :start_date, :header_height, :year_x, :year_y,
                :year_fill, :year_font_size, :year_font_family, :year_font_weight, :month_name_fill, :month_name_font_size,
                :month_name_font_family, :month_name_font_weight, :rotate_month_names, :opt_highlight_weekends,
                :opt_show_day_names, :hide_weekend_day_names, :theme, :opt_show_moon_illumination, :opt_show_moon_phase,
                :opt_show_grid, :grid_stroke, :lat, :lng

  validates :cell_background_color, :weekend_background_color, :year_fill, :year_font_size, :year_font_family,
            :year_font_weight, :month_name_fill, :month_name_font_size, :month_name_font_family, :month_name_font_weight,
            :start_date, :header_height, :year_x, :year_y,
            :grid_stroke, presence: true
  validates  :rotate_month_names, :opt_highlight_weekends,
            :opt_show_day_names, :hide_weekend_day_names, :opt_show_moon_illumination, :opt_show_moon_phase,
            :opt_show_grid, inclusion: { in: [true, false] }
  validates :theme, inclusion: { in: ['', 'vermontWeekends', 'rainbowWeekends', 'rainbowDays1', 'rainbowDays2', 'rainbowDays3'] }
  validates :lat, :lng, numericality: true, allow_nil: true

  def initialize(attributes = {})
    super
    @cell_background_color ||= 'white'
    @weekend_background_color ||= 'grey'
    @start_date ||= Date.today
    @header_height || attributes[:headerHeight] ||= 100
    @year_x ||= 0
    @year_y ||= 0
    @year_fill ||= 'black'
    @year_font_size ||= '12px'
    @year_font_family ||= 'Arial'
    @year_font_weight ||= 'normal'
    @month_name_fill ||= 'black'
    @month_name_font_size ||= '12px'
    @month_name_font_family ||= 'Arial'
    @month_name_font_weight ||= 'normal'
    @rotate_month_names ||= false
    @opt_highlight_weekends ||= false
    @opt_show_day_names ||= false
    @hide_weekend_day_names ||= false
    @theme ||= ''
    @opt_show_moon_illumination ||= false
    @opt_show_moon_phase ||= false
    @opt_show_grid ||= false
    @grid_stroke ||= 'black'
  end
end
