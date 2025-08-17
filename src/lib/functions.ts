import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebase";

const region = "europe-west1";
const fns = getFunctions(app, region);

export const bootstrapAdminFn   = httpsCallable(fns, "bootstrapAdmin");
export const submitPickFn       = httpsCallable(fns, "submitPick");
export const processMatchdayFn  = httpsCallable(fns, "processMatchday");
export const ingestResultsFn    = httpsCallable(fns, "ingestResults");
export const generateSummaryFn  = httpsCallable(fns, "generateSummary");
