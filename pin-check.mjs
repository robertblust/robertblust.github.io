// How far this site's model pin has fallen behind what it points at.
//
// `source.json` names one commit of the model, and that pin is editorial: it says which state
// of the model these pages publish, so moving it is a decision someone makes rather than one a
// tool makes for them. This reports the distance and nothing else — it writes no pin, and it
// never fails the build, because a pin behind its upstream is not a broken site.
//
// The check itself is `@robertblust/design/verify/pin`, shared with the sibling site: both need
// the identical thing and a second copy would be a second thing to keep true.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pinDrift, pinReport } from "@robertblust/design/verify/pin";

pinReport(await pinDrift({ root: path.dirname(fileURLToPath(import.meta.url)) }));
