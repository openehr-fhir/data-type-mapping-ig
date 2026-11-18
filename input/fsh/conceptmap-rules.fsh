Alias: $OpenEHRNullFlavours = https://specifications.openehr.org/fhir/codesystem-null_flavours|0.1.0-snapshot
Alias: $OpenEHRNormalStatuses = https://specifications.openehr.org/fhir/codesystem-normal_statuses|0.1.0-snapshot
Alias: $DataAbsentReason = http://terminology.hl7.org/CodeSystem/data-absent-reason|2.0.0
Alias: $ObservationInterpretation = http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation|4.0.0
Alias: $V3NullFlavor = http://terminology.hl7.org/CodeSystem/v3-NullFlavor|4.0.0

RuleSet: TerminologyMapMetadata(id, name, page)
* url = "http://hl7.org/fhir/uv/openehr-data-type-mapping/ConceptMap/{id}"
* version = "0.1.0"
* name = "{name}"
* status = #draft
* experimental = true
* date = "2026-11-17"
* publisher = "HL7 International / FHIR Infrastructure"
* relatedArtifact[0].type = #derived-from
* relatedArtifact[0].citation = "The [field tables]({page}.html) are the normative statement, with citations to the openEHR Reference Model and FHIR R5. These maps express code relationships, not executable structural transforms."
* property[0].code = #fidelity
* property[0].description = "Information preservation in the stated direction: lossless or lossy. This is separate from semantic relationship and does not promise that automatic reversal is safe."
* property[0].type = #string
* property[1].code = #maturity
* property[1].description = "Decision maturity from the field table. These terminology correspondences remain open."
* property[1].type = #string

RuleSet: MapCode(source, target, relationship, fidelity, note)
* group[0].element[+].code = #{source}
* group[0].element[=].target[0].code = #{target}
* group[0].element[=].target[0].relationship = #{relationship}
* group[0].element[=].target[0].comment = "{note}"
* group[0].element[=].target[0].property[0].code = #fidelity
* group[0].element[=].target[0].property[0].valueString = "{fidelity}"
* group[0].element[=].target[0].property[1].code = #maturity
* group[0].element[=].target[0].property[1].valueString = "open"

RuleSet: NullFlavourSources
* relatedArtifact[+].type = #documentation
* relatedArtifact[=].citation = "[openEHR Support Terminology: null flavours](https://specifications.openehr.org/releases/TERM/latest/SupportTerminology.html#_null_flavours); [FHIR R5: missing data](https://hl7.org/fhir/R5/extensibility.html#Special-Case); [THO: data-absent-reason](https://terminology.hl7.org/CodeSystem-data-absent-reason.html)."

RuleSet: NormalStatusSources
* relatedArtifact[+].type = #documentation
* relatedArtifact[=].citation = "[openEHR RM: DV_ORDERED](https://specifications.openehr.org/releases/RM/latest/data_types.html#_dv_ordered_class); [FHIR R5: Observation.interpretation](https://hl7.org/fhir/R5/observation-definitions.html#Observation.interpretation); [THO: ObservationInterpretation](https://terminology.hl7.org/CodeSystem-v3-ObservationInterpretation.html)."

RuleSet: V3NullFlavorSources
* relatedArtifact[+].type = #documentation
* relatedArtifact[=].citation = "[openEHR Support Terminology: null flavours](https://specifications.openehr.org/releases/TERM/latest/SupportTerminology.html#_null_flavours); [FHIR R5: missing data](https://hl7.org/fhir/R5/extensibility.html#Special-Case); [THO: v3 NullFlavor](https://terminology.hl7.org/CodeSystem-v3-NullFlavor.html)."
