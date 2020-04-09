export class ApiFormatterService {
    static formatHyperlink(link, optionalName) {
        optionalName = optionalName ? optionalName : link;
        return `[${link}](${optionalName})`;
    }
}
