package com.vnticket.service.impl;

import com.vnticket.dto.BookingDTO;
import com.vnticket.dto.BookingDetailDTO;
import com.vnticket.entity.Event;
import com.vnticket.exception.BadRequestException;
import com.vnticket.exception.ResourceNotFoundException;
import com.vnticket.repository.EventRepository;
import com.vnticket.service.BookingService;
import com.vnticket.service.ExportService;
import net.sf.jasperreports.engine.JRParameter;
import net.sf.jasperreports.engine.JasperCompileManager;
import net.sf.jasperreports.engine.JasperExportManager;
import net.sf.jasperreports.engine.JasperFillManager;
import net.sf.jasperreports.engine.JasperPrint;
import net.sf.jasperreports.engine.JasperReport;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;
import net.sf.jasperreports.engine.export.ooxml.JRXlsxExporter;
import net.sf.jasperreports.export.SimpleExporterInput;
import net.sf.jasperreports.export.SimpleOutputStreamExporterOutput;
import net.sf.jasperreports.export.SimpleXlsxReportConfiguration;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ExportServiceImpl implements ExportService {

    private final BookingService bookingService;
    private final EventRepository eventRepository;
    private volatile JasperReport compiledReport;

    public ExportServiceImpl(BookingService bookingService, EventRepository eventRepository) {
        this.bookingService = bookingService;
        this.eventRepository = eventRepository;
    }

    @Override
    public byte[] exportBookingsToPdf(Long eventId, Long requesterId, boolean admin) throws Exception {
        JasperPrint print = createPrint(eventId, requesterId, admin, false);
        return JasperExportManager.exportReportToPdf(print);
    }

    @Override
    public byte[] exportBookingsToExcel(Long eventId, Long requesterId, boolean admin) throws Exception {
        JasperPrint print = createPrint(eventId, requesterId, admin, true);
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        JRXlsxExporter exporter = new JRXlsxExporter();
        exporter.setExporterInput(new SimpleExporterInput(print));
        exporter.setExporterOutput(new SimpleOutputStreamExporterOutput(output));

        SimpleXlsxReportConfiguration configuration = new SimpleXlsxReportConfiguration();
        configuration.setOnePagePerSheet(false);
        configuration.setDetectCellType(true);
        configuration.setWhitePageBackground(false);
        configuration.setRemoveEmptySpaceBetweenRows(true);
        configuration.setRemoveEmptySpaceBetweenColumns(true);
        exporter.setConfiguration(configuration);
        exporter.exportReport();
        return output.toByteArray();
    }

    private JasperPrint createPrint(
            Long eventId, Long requesterId, boolean admin, boolean excel) throws Exception {
        Event event = authorize(eventId, requesterId, admin);
        List<BookingDTO> bookings = bookingService.getPaidBookingsByEvent(eventId);
        List<Map<String, Object>> rows = toRows(bookings);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

        Map<String, Object> parameters = new HashMap<>();
        parameters.put("eventName", event.getName());
        parameters.put("reportDate", LocalDateTime.now().format(formatter));
        if (excel) {
            parameters.put(JRParameter.IS_IGNORE_PAGINATION, true);
        }
        return JasperFillManager.fillReport(
                getCompiledReport(), parameters, new JRBeanCollectionDataSource(rows));
    }

    private Event authorize(Long eventId, Long requesterId, boolean admin) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        if (!admin && (requesterId == null || event.getOrganizer() == null
                || !requesterId.equals(event.getOrganizer().getId()))) {
            throw new BadRequestException("You do not have permission to export this event");
        }
        return event;
    }

    private List<Map<String, Object>> toRows(List<BookingDTO> bookings) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        List<Map<String, Object>> rows = new ArrayList<>(bookings.size());
        for (BookingDTO booking : bookings) {
            Map<String, Object> row = new HashMap<>();
            row.put("id", booking.getId());
            row.put("username", valueOrEmpty(booking.getUsername()));
            row.put("email", valueOrEmpty(booking.getEmail()));
            row.put("bookingTimeStr",
                    booking.getBookingTime() == null ? "" : booking.getBookingTime().format(formatter));
            row.put("totalAmount", booking.getTotalAmount());
            row.put("ticketDetails", formatTicketDetails(booking.getBookingDetails()));
            rows.add(row);
        }
        return rows;
    }

    private String formatTicketDetails(List<BookingDetailDTO> details) {
        if (details == null || details.isEmpty()) {
            return "";
        }
        return details.stream()
                .map(detail -> valueOrEmpty(detail.getZoneName()) + " x" + detail.getQuantity())
                .reduce((left, right) -> left + ", " + right)
                .orElse("");
    }

    private String valueOrEmpty(String value) {
        return value == null ? "" : value;
    }

    private JasperReport getCompiledReport() throws Exception {
        JasperReport report = compiledReport;
        if (report != null) {
            return report;
        }
        synchronized (this) {
            if (compiledReport == null) {
                try (InputStream template = getClass().getResourceAsStream("/reports/bookings.jrxml")) {
                    if (template == null) {
                        throw new IllegalStateException("Booking report template not found");
                    }
                    compiledReport = JasperCompileManager.compileReport(template);
                }
            }
            return compiledReport;
        }
    }
}
