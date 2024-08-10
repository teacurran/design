# app/controllers/calendars_controller.rb
class CalendarsController < ApplicationController
  require 'puppeteer-ruby'
  require 'json'
  require 'builder'

  def initialize
    super

    @cell_width = 50
    @cell_height = 75
    @cell_padding = 5

    @grid_width = 32 * @cell_width
    @grid_height = 12 * @cell_height
  end

  def create
    format = params[:format]
    body_json = request.body.read || '{}'

    Rails.logger.info("Received request with body: #{body_json}")
    calendar_params = body_json.present? ? JSON.parse(body_json) : {}

    default_calendar = get_default_calendar
    effective_calendar = default_calendar.merge(calendar_params)

    Rails.logger.info("Effective calendar: #{effective_calendar}")
    calendar_form = CalendarForm.new(effective_calendar)

    unless calendar_form.valid?
      render json: { error: calendar_form.errors.full_messages }, status: :bad_request
      return
    end

    svg = generate_svg(effective_calendar)
    # svg = svg_dom.html

    if %w[pdf png].include?(format)
      Puppeteer.launch(headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox']) do |browser|
        browser.new_page do |page|
          page.set_content(svg)

          if format == 'png'
            png = page.screenshot(type: 'png', full_page: true)
            filename = "calendar-#{Date.today}.png"
            send_data png, filename: filename, type: 'image/png', disposition: 'attachment'
          elsif format == 'pdf'
            pdf = page.pdf(format: 'A1', landscape: true, scale: 2)
            filename = "calendar-#{Date.today}.pdf"
            send_data pdf, filename: filename, type: 'application/pdf', disposition: 'attachment'
          end
        end
      end
    else
      # render xml: svg, content_type: 'image/svg+xml'
      send_data svg, type: 'image/svg+xml', disposition: 'inline'
    end
  end

  def get_default_calendar
    {
      header_height: 100,
      year_x: 50,
      year_y: 80,
      year_fill: '#a1a1a1',
      year_font_size: '80px',
      year_font_family: 'Helvetica',
      year_font_weight: 'bold',

      month_name_fill: '#a1a1a1',
      month_name_font_size: '20px',
      month_name_font_family: 'Helvetica',
      month_name_font_weight: 'bold',
      rotate_month_names: false,

      opt_highlight_weekends: false,
      opt_show_day_names: false,
      hide_weekend_day_names: false,
      opt_show_moon_illumination: false,
      opt_show_moon_phase: false,

      opt_show_grid: true,
      grid_stroke: '#c1c1c1',
      lat: 44.25644,
      lng: -72.26793,
      cell_background_color: 'rgba(255, 255, 255, 0)',
      weekend_background_color: 'rgba(0, 0, 0, 0.1)',
      start_date: Date.new(Date.today.year, 1, 1),
      theme: ''
    }
  end

  def get_svg_as_document_dom(calendar)
    # Implement this method to return the SVG DOM
  end

  def generate_svg(calendar)

    width = @grid_width
    height = @grid_height + calendar[:header_height]
    total_columns = 32
    total_rows = 12
    year = calendar[:start_date].year

    xml = Builder::XmlMarkup.new(indent: 2)
    xml.instruct! :xml, version: "1.0", encoding: "UTF-8"
    xml.svg(width: width,
            height: height,
            xmlns: 'http://www.w3.org/2000/svg',
            viewBox: "0 0 #{@grid_width} #{@grid_height}",
            preserveAspectRatio: 'xMidYMid meet') do

      xml.text(year,
               x: calendar[:year_x],
               y: calendar[:year_y],
               fill: calendar[:year_fill],
               :'font-size' => calendar[:year_font_size],
               :'font-family' => calendar[:year_font_family], font_weight: calendar[:year_font_weight])

      (1..total_rows).each do |row|
        weekend_index = -1

        (0..total_columns).each do |day|

          x = day * @cell_width
          y = row * @cell_height + 99

          if day == 0
            append_month_cell(xml, x, y, row, calendar)
            # append_month_cell logic here
            next
          end

          date = nil
          begin
            date = Date.new(year, row, day)
          rescue ArgumentError
            next
          end

          month = date.month
          day_of_week = date.wday

          is_weekend = false
          if day_of_week === 0 || day_of_week === 6
            is_weekend = true
            weekend_index = weekend_index + 1
          end


          # cell background
          xml.rect(width: @cell_width,
                   height: @cell_height,
                   x: day * @cell_width,
                   y: row * @cell_height + 99,
                   fill: calendar[:cell_background_color])

          if month == row
            xml.text(day,
                      x: day * @cell_width + @cell_padding,
                      y: row * @cell_height + 99 + 14,
                      :'font-size' => '12px',
                      :'font-family' => 'Helvetica')
            # append_day_name logic here
            # append_moon logic here
            # append_moon_phase logic here
          end
          if calendar[:opt_show_grid]
            xml.rect(width: @cell_width,
                     height: @cell_height,
                     x: day * @cell_width,
                     y: row * @cell_height + 99,
                     stroke: calendar[:grid_stroke],
                     fill: 'none')
          end
        end
      end
      if calendar[:opt_show_grid]
        xml.rect(width: @cell_width * 31,
                 height: @cell_height * 12 + 2,
                 :'stroke-location' => 'inside',
                 x: @cell_width,
                 y: calendar[:header_height] - 1,
                 stroke: calendar[:grid_stroke],
                 :'stroke-width' => 1,
                 fill: 'none')
      end
    end
  end

  def append_month_cell(xml, x, y, month, calendar)
    xml.text(month,
             x: x,
             y: y,
             fill: calendar[:month_name_fill],
             :'font-size' => calendar[:month_name_font_size],
             :'font-family' => calendar[:month_name_font_family],
             :'font-weight' => calendar[:month_name_font_weight])
  end

  def get_day_name(date)
    date.strftime('%a')
  end
end
