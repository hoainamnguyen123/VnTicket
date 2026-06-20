package com.vnticket.service;

public interface ExportService {

    byte[] exportBookingsToPdf(Long eventId, Long requesterId, boolean admin) throws Exception;

    byte[] exportBookingsToExcel(Long eventId, Long requesterId, boolean admin) throws Exception;
}
