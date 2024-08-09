# app/controllers/calendars_controller.rb
class CalendarsController < ApplicationController
  require 'puppeteer-ruby'
  require 'json'

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

    svg_dom = get_svg_as_document_dom(effective_calendar)
    svg = svg_dom.html

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
      render xml: svg, content_type: 'image/svg+xml'
    end
  end

  private

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

      opt_show_grid: false,
      grid_stroke: '#c1c1c1',
      lat: 44.25644,
      lng: -72.26793,
      cell_background_color: 'cellBackgroundColor',
      weekend_background_color: 'weekendBackgroundColor',
      start_date: 'startDate',
      theme: ''
    }
  end

  def get_svg_as_document_dom(calendar)
    # Implement this method to return the SVG DOM
  end
end
