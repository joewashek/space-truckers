type LogObject = {
    type: "INFO" | "WARN" | "ERROR" | "FATAL";
    message: string;
};

class ConsoleProxy {
    private _consoleIsPresent: boolean = false;
    private _messageBuffer: string[] = [];
    constructor(private console: Console) {
        this._consoleIsPresent = console ? true : false;
    }

    public logInfo(message: string) {
        const logObj: LogObject = { type: "INFO", message };
        if (this._consoleIsPresent) {
            this.console.log(logObj);
            return;
        }
        this._messageBuffer.push(message);
    }

    public logWarning(message: string) {
        const logObj: LogObject = { type: "WARN", message };
        if (this._consoleIsPresent) {
            this.console.warn(logObj);
            return;
        }
        this._messageBuffer.push(message);
    }

    public logError(message: string) {
        const logObj: LogObject = { type: "ERROR", message };
        if (this._consoleIsPresent) {
            this.console.error(logObj);
            return;
        }
        this._messageBuffer.push(message);
    }

    public logFatal(message: string) {
        const logObj: LogObject = { type: "FATAL", message };
        if (this._consoleIsPresent) {
            this.console.error(logObj);
            return;
        }
        this._messageBuffer.push(message);
    }
}
const logger = new ConsoleProxy(console);
export default logger;
