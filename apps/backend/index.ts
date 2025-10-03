import {app as crudApp} from "./crud";
import {app as webhookApp} from "./webhook-handler";

crudApp.listen(8080);
webhookApp.listen(8082);