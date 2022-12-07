"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Service = exports.IStatefulService = exports.IService = void 0;
require("reflect-metadata");
class IService {
    constructor(manager) {
        this.manager = manager;
    }
}
exports.IService = IService;
class IStatefulService extends IService {
}
exports.IStatefulService = IStatefulService;
// eslint-disable-next-line @typescript-eslint/naming-convention
const Service = (config) => (cls, prop) => {
    var _a;
    const serviceProps = (_a = Reflect.getMetadata('services', cls)) !== null && _a !== void 0 ? _a : [];
    if (!serviceProps.includes(prop)) {
        serviceProps.push(prop);
        Reflect.defineMetadata('services', serviceProps, cls);
    }
    Reflect.defineMetadata('service', config, cls, prop);
};
exports.Service = Service;
//# sourceMappingURL=service.js.map