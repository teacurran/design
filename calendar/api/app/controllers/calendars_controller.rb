# app/controllers/calendars_controller.rb
class CalendarsController < ApplicationController
  require 'puppeteer-ruby'
  require 'json'

  def create
    format = params[:format]
    body_json = request.body.read || '{}'

    Rails.logger.info("Received request with body: #{body_json}")
    calendar_params = JSON.parse(body_json)
    calendar_form = CalendarForm.new(calendar_params)

    unless calendar_form.valid?
      render json: { error: calendar_form.errors.full_messages }, status: :bad_request
      return
    end

    default_calendar = get_default_calendar
    calendar = parsed.data
    effective_calendar = default_calendar.merge(calendar)

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
    # Implement this method to return the default calendar
  end

  def get_svg_as_document_dom(calendar)
    # Implement this method to return the SVG DOM
  end
end
