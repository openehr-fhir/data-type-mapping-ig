Instance: openehr-null-flavour-to-data-absent-reason
InstanceOf: ConceptMap
Usage: #definition
Title: "openEHR null flavour to FHIR data-absent-reason"
Description: "The four openEHR null-flavour codes mapped to FHIR data-absent-reason. The no-information fallback is explicitly lossy and is not an equivalence."
* insert TerminologyMapMetadata(openehr-null-flavour-to-data-absent-reason, OpenEHRNullFlavourToDataAbsentReason, mapping-coded)
* insert NullFlavourSources
* purpose = "Translate the code in ELEMENT.null_flavour for the documented missing-data use case. The four source codes belong to the null_flavours group of openEHR terminology, whose canonical CodeSystem is supplied by openehr.base. This does not decide whether the result belongs in Observation.dataAbsentReason or the data-absent-reason extension. The inverse is published separately because 271 and 253 both map to unknown."
* targetScopeCanonical = "http://hl7.org/fhir/ValueSet/data-absent-reason|5.0.0"
* group[0].source = $OpenEHRNullFlavours
* group[0].target = $DataAbsentReason
* insert MapCode(253, unknown, equivalent, lossless, [[Exact code correspondence. Reverse unknown maps to 253; it cannot recover a source 271 that used the lossy fallback.]])
* insert MapCode(272, masked, equivalent, lossless, [[Exact code correspondence for information withheld for security or privacy reasons.]])
* insert MapCode(273, not-applicable, equivalent, lossless, [[Exact code correspondence for a value that does not apply.]])
* insert MapCode(271, unknown, related-to, lossy, [[No information has no exact data-absent-reason counterpart. The documented fallback loses the distinction from 253 (unknown). This is an open working-group policy, not a claim that the concepts are equivalent or hierarchically related.]])

Instance: data-absent-reason-to-openehr-null-flavour
InstanceOf: ConceptMap
Usage: #definition
Title: "FHIR data-absent-reason to openEHR null flavour"
Description: "All fifteen FHIR R5 data-absent-reason codes mapped to the four openEHR null-flavour codes, preserving the guide's explicit, open semantic choices rather than inferring a map from the THO hierarchy."
* insert TerminologyMapMetadata(data-absent-reason-to-openehr-null-flavour, DataAbsentReasonToOpenEHRNullFlavour, mapping-coded)
* insert NullFlavourSources
* purpose = "Translate a data-absent-reason code into ELEMENT.null_flavour. Only unknown, masked and not-applicable have exact correspondences. All other targets are the working group's documented semantic choices pending re-review; each loses the distinction stated in its comment. They are not hierarchy-derived equivalences. The openEHR CodeSystem canonical identifies the null_flavours subset of the RM's openehr terminology; it is not a new RM terminology_id. The enclosing DV_CODED_TEXT and its mandatory rubric still require construction."
* sourceScopeCanonical = "http://hl7.org/fhir/ValueSet/data-absent-reason|5.0.0"
* group[0].source = $DataAbsentReason
* group[0].target = $OpenEHRNullFlavours
* insert MapCode(unknown, 253, equivalent, lossless, [[Exact code correspondence for unknown.]])
* insert MapCode(masked, 272, equivalent, lossless, [[Exact code correspondence for masked information.]])
* insert MapCode(not-applicable, 273, equivalent, lossless, [[Exact code correspondence for not applicable.]])
* insert MapCode(asked-unknown, 253, related-to, lossy, [[Loses the fact that the source was asked. The target records only unknown.]])
* insert MapCode(temp-unknown, 253, related-to, lossy, [[Loses the expectation that the value may become known later.]])
* insert MapCode(not-asked, 253, related-to, lossy, [[Loses the fact that the information was not sought.]])
* insert MapCode(not-a-number, 253, related-to, lossy, [[Loses the specific NaN condition. The guide chooses unknown even though THO places this code under error; this policy remains open.]])
* insert MapCode(negative-infinity, 253, related-to, lossy, [[Loses the negative-infinity condition. The guide chooses unknown rather than following THO's error hierarchy.]])
* insert MapCode(positive-infinity, 253, related-to, lossy, [[Loses the positive-infinity condition. The guide chooses unknown rather than following THO's error hierarchy.]])
* insert MapCode(not-performed, 253, related-to, lossy, [[Loses the fact that the procedure was not performed.]])
* insert MapCode(asked-declined, 272, related-to, lossy, [[Loses the distinction between declining to answer and masking information. This is the documented semantic choice, not THO's unknown hierarchy.]])
* insert MapCode(not-permitted, 272, related-to, lossy, [[Loses the distinction between a value forbidden in this context and information masked for privacy or security.]])
* insert MapCode(unsupported, 273, related-to, lossy, [[Loses the distinction between a source system unable to support an element and a value that does not apply.]])
* insert MapCode(as-text, 271, related-to, lossy, [[Loses the indication that the value is available in narrative text; the null flavour alone does not carry that text.]])
* insert MapCode(error, 271, related-to, lossy, [[Loses the system or workflow error as the specific reason for absence.]])

Instance: openehr-null-flavour-to-v3-nullflavor
InstanceOf: ConceptMap
Usage: #definition
Title: "openEHR null flavour to HL7 v3 NullFlavor"
Description: "The four openEHR null-flavour codes and their direct v3 NullFlavor correspondences. This draft terminology map supports the planned v3 use case; it does not change the guide's current data-absent-reason output."
* insert TerminologyMapMetadata(openehr-null-flavour-to-v3-nullflavor, OpenEHRNullFlavourToV3NullFlavor, mapping-coded)
* insert V3NullFlavorSources
* purpose = "Publish code correspondences for the planned v3 NullFlavor support described in Coded Data. These are code relationships only: no openEHR value currently produces an iso21090-nullFlavor extension in the reference implementation. The structural field row therefore remains unmapped. Use the separate data-absent-reason map for the guide's current outbound conversion."
* targetScopeCanonical = "http://terminology.hl7.org/ValueSet/v3-NullFlavor|3.0.0"
* group[0].source = $OpenEHRNullFlavours
* group[0].target = $V3NullFlavor
* insert MapCode(271, NI, equivalent, lossless, [[Direct no-information correspondence for the planned v3 terminology mapping; this does not enable v3 extension emission.]])
* insert MapCode(253, UNK, equivalent, lossless, [[Direct unknown correspondence for the planned v3 terminology mapping.]])
* insert MapCode(272, MSK, equivalent, lossless, [[Direct masked correspondence for the planned v3 terminology mapping.]])
* insert MapCode(273, NA, equivalent, lossless, [[Direct not-applicable correspondence for the planned v3 terminology mapping.]])

Instance: v3-nullflavor-to-openehr-null-flavour
InstanceOf: ConceptMap
Usage: #definition
Title: "HL7 v3 NullFlavor to openEHR null flavour"
Description: "The documented v3 NullFlavor roll-up into the four openEHR null flavours, with explicit loss of finer reasons. Draft terminology support only: the reference implementation does not yet consume the iso21090-nullFlavor extension."
* insert TerminologyMapMetadata(v3-nullflavor-to-openehr-null-flavour, V3NullFlavorToOpenEHRNullFlavour, mapping-coded)
* insert V3NullFlavorSources
* purpose = "Publish the code correspondences described for planned v3 support, not an assertion that the reference implementation consumes v3 extensions. NI, UNK, MSK and NA are direct; more specific reasons collapse to 271 or 253. The retired, message-only NP code is explicitly unmapped in this application-data use case. Constructing ELEMENT.null_flavour and its rubric remains a structural conversion."
* sourceScopeCanonical = "http://terminology.hl7.org/ValueSet/v3-NullFlavor|3.0.0"
* group[0].source = $V3NullFlavor
* group[0].target = $OpenEHRNullFlavours
* insert MapCode(NI, 271, equivalent, lossless, [[Direct no-information correspondence.]])
* insert MapCode(UNK, 253, equivalent, lossless, [[Direct unknown correspondence.]])
* insert MapCode(MSK, 272, equivalent, lossless, [[Direct masked correspondence.]])
* insert MapCode(NA, 273, equivalent, lossless, [[Direct not-applicable correspondence.]])
* insert MapCode(INV, 271, related-to, lossy, [[Loses the fact that the value is outside the permitted value domain.]])
* insert MapCode(DER, 271, related-to, lossy, [[Loses the fact that a value must be derived and any derivation information.]])
* insert MapCode(OTH, 271, related-to, lossy, [[Loses the distinction that the actual value lies outside the permitted coded domain.]])
* insert MapCode(UNC, 271, related-to, lossy, [[Loses the distinction that encoding into the permitted domain has not yet been attempted or completed.]])
* insert MapCode(NINF, 271, related-to, lossy, [[Loses the specific negative-infinity condition. This follows the documented v3 correspondence, not the separate data-absent-reason policy.]])
* insert MapCode(PINF, 271, related-to, lossy, [[Loses the specific positive-infinity condition. This follows the documented v3 correspondence, not the separate data-absent-reason policy.]])
* insert MapCode(ASKU, 253, related-to, lossy, [[Loses the fact that information was sought but not found.]])
* insert MapCode(NASK, 253, related-to, lossy, [[Loses the fact that the information was not sought.]])
* insert MapCode(NAVU, 253, related-to, lossy, [[Loses the distinction that information is currently unavailable with no expectation about future availability.]])
* insert MapCode(QS, 253, related-to, lossy, [[Loses the sufficient-but-unspecified quantity distinction.]])
* insert MapCode(TRC, 253, related-to, lossy, [[Loses the fact that the quantity is greater than zero but too small to quantify.]])
* insert MapCode(NAV, 253, related-to, lossy, [[Loses the expectation that the information will become available later.]])
* group[0].element[+].code = #NP
* group[0].element[=].display = "not present"
* group[0].element[=].noMap = true
