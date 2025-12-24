/**
 * HID Device Reader Module
 * Handles reading data from HID devices (e.g., graphics tablets) using WebHID API
 * and processing the raw data according to configuration byte code mappings
 */

import { processDeviceData } from './data-helpers.js';
import type { Config } from '../models/index.js';

export interface HIDConfig {
    mappings: Record<string, any> | Config['byteCodeMappings'];
    reportId?: number;
}

export type HIDDataCallback = (data: Record<string, string | number | boolean>) => void;
export type WarningCallback = (message: string) => void;

export class HIDReader {
    private device: HIDDevice;
    private config: HIDConfig;
    private dataCallback: HIDDataCallback;
    private isRunning: boolean = false;

    constructor(
        device: HIDDevice,
        config: HIDConfig,
        dataCallback: HIDDataCallback,
        _warningCallback?: WarningCallback
    ) {
        this.device = device;
        this.config = config;
        this.dataCallback = dataCallback;
    }

    /**
     * Process raw device data according to configuration byte code mappings
     * Delegates to processDeviceData helper function
     */
    processDeviceData(data: Uint8Array): Record<string, string | number | boolean> {
        return processDeviceData(data, this.config.mappings);
    }

    /**
     * Start reading from the HID device in a loop
     */
    async startReading(): Promise<void> {
        if (!this.device) {
            throw new Error('No device available for reading');
        }

        this.isRunning = true;

        // IMPORTANT: Set up input report listener BEFORE opening
        // This ensures we don't miss any reports
        const inputReportHandler = (event: HIDInputReportEvent) => {
            if (!this.isRunning) return;

            // Only process reports matching our configured reportId
            const expectedReportId = this.config.reportId;
            if (expectedReportId !== undefined && event.reportId !== expectedReportId) {
                return; // Skip reports that don't match
            }

            const { data } = event;
            const dataArray = new Uint8Array(data.buffer);

            // Process the data
            const processedData = this.processDeviceData(dataArray);

            // Call the callback with processed data
            if (this.dataCallback) {
                this.dataCallback(processedData);
            }
        };
        
        this.device.addEventListener('inputreport', inputReportHandler);
        
        // Wait a microtask to ensure listener is registered
        await new Promise(resolve => setTimeout(resolve, 0));

        // NOW open the device (after listener is attached)
        if (!this.device.opened) {
            await this.device.open();
        }
    }

    /**
     * Stop the reading loop
     */
    stop(): void {
        console.log('[HID] Stopping HID reader...');
        this.isRunning = false;
    }

    /**
     * Close the HID device
     */
    async close(): Promise<void> {
        if (this.device && this.device.opened) {
            try {
                console.log('[HID] Closing HID device...');
                await this.device.close();
                console.log('[HID] HID device closed successfully');
            } catch (error) {
                console.error('[HID] Error closing device:', error);
            }
        }
    }
}

