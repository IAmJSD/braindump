import { homedir } from "os";
import { join } from "path";

export const braindumpDataDir = join(homedir(), ".braindump");
export const braindumpDbDir = join(braindumpDataDir, "db");
export const pendingImportTarPath = join(braindumpDataDir, "import-data-dir.tar");
