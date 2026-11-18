Instance: openehr-normal-status-to-observation-interpretation
InstanceOf: ConceptMap
Usage: #definition
Title: "openEHR normal status to FHIR observation interpretation"
Description: "The explicitly documented H, L and N correspondences from openEHR normal_statuses to HL7 ObservationInterpretation. This is a partial map, not a mapping of the entire normal-status code system."
* insert TerminologyMapMetadata(openehr-normal-status-to-observation-interpretation, OpenEHRNormalStatusToObservationInterpretation, mapping-quantity)
* insert NormalStatusSources
* purpose = "Translate H, L and N from DV_ORDERED.normal_status when the surrounding archetype maps the value to an Observation. No correspondence is asserted for HH, HHH, LL or LLL: their interpretation needs working-group review. Omitted codes are not declared invalid and no identity fallback is provided. Selecting and constructing Observation.interpretation remains an archetype-level responsibility."
* sourceScopeCanonical = "https://specifications.openehr.org/fhir/valueset-normal_statuses|0.1.0-snapshot"
* targetScopeCanonical = "http://hl7.org/fhir/ValueSet/observation-interpretation|5.0.0"
* group[0].source = $OpenEHRNormalStatuses
* group[0].target = $ObservationInterpretation
* insert MapCode(H, H, equivalent, lossless, [[The documented high/above-normal code correspondence only.]])
* insert MapCode(L, L, equivalent, lossless, [[The documented low/below-normal code correspondence only.]])
* insert MapCode(N, N, equivalent, lossless, [[The documented normal code correspondence only.]])

Instance: observation-interpretation-to-openehr-normal-status
InstanceOf: ConceptMap
Usage: #definition
Title: "FHIR observation interpretation to openEHR normal status"
Description: "The explicitly documented H, L and N correspondences from HL7 ObservationInterpretation to openEHR normal_statuses. Other interpretation codes remain outside this partial map."
* insert TerminologyMapMetadata(observation-interpretation-to-openehr-normal-status, ObservationInterpretationToOpenEHRNormalStatus, mapping-quantity)
* insert NormalStatusSources
* purpose = "Translate only H, L and N into DV_ORDERED.normal_status. The openEHR binding is required and the wider FHIR interpretation vocabulary cannot be copied into it indiscriminately. No correspondence or default is asserted for other source codes, including similarly spelled HH and LL. This partial map does not remove the field table's lossy verdict for the general FHIR-to-openEHR direction."
* sourceScopeCanonical = "http://hl7.org/fhir/ValueSet/observation-interpretation|5.0.0"
* targetScopeCanonical = "https://specifications.openehr.org/fhir/valueset-normal_statuses|0.1.0-snapshot"
* group[0].source = $ObservationInterpretation
* group[0].target = $OpenEHRNormalStatuses
* insert MapCode(H, H, equivalent, lossless, [[Only the high interpretation code is carried; this does not assert preservation of the rest of Observation.interpretation.]])
* insert MapCode(L, L, equivalent, lossless, [[Only the low interpretation code is carried; other interpretation codes are outside this partial map.]])
* insert MapCode(N, N, equivalent, lossless, [[Only the normal interpretation code is carried; multiple codings and surrounding resource context still require structural mapping.]])
