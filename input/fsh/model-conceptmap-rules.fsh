RuleSet: ModelConceptMapMetadata(id, name)
* insert TerminologyMapMetadata({id}, {name}, mapping)
* purpose = "Show directional conceptual correspondences between the openEHR logical models and FHIR types/resources described by this guide. A system is the versioned StructureDefinition canonical and a code is an exact snapshot.element.id, not an arbitrary dotted path or FHIRPath expression. Root entries describe type correspondences; other entries describe fields. Select the applicable model pair and read conditions before using a target. These maps do not execute conversions or choose between archetype-dependent representations. Omitted elements have no asserted correspondence; noMap means no mapping is defined in this guide for this model pair."
* relatedArtifact[0].citation = "The [field tables](mapping.html) remain normative and cite both specifications. Each target links its corresponding table. StructureDefinition element IDs are treated as the codes of implicit code systems; no replacement CodeSystems are defined."
* relatedArtifact[+].type = #documentation
* relatedArtifact[=].citation = "[openEHR RM: data types](https://specifications.openehr.org/releases/RM/latest/data_types.html); [FHIR R5: data types](https://hl7.org/fhir/R5/datatypes.html); [FHIR R5: ConceptMap scope](https://hl7.org/fhir/R5/conceptmap.html#scope). The linked field tables provide the attribute-level citations, including extension and resource definitions."
* property[0].description = "Directional information preservation, conservatively lossy when a source/target pair has both lossless and lossy cases. Comments distinguish the cases and name the loss. This is not semantic equivalence."
* property[1].description = "Decision maturity from the field table: settled or open. An unreviewed correspondence is not asserted."
* property[2].code = #scope
* property[2].description = "datatype or archetype, as stated by the field table. An archetype mapping needs surrounding resource/template context."
* property[2].type = #string
* property[3].code = #condition
* property[3].description = "Human-readable applicability condition, not an executable expression. These conditions must be considered together with the target comment and the normative table."
* property[3].type = #string

RuleSet: OpenEHRModelGroup(model, fhir)
* group[+].source = "http://openehr.org/fhir/StructureDefinition/{model}|0.1.0-snapshot"
* group[=].target = "http://hl7.org/fhir/StructureDefinition/{fhir}|5.0.0"

RuleSet: FHIRModelGroup(fhir, model)
* group[+].source = "http://hl7.org/fhir/StructureDefinition/{fhir}|5.0.0"
* group[=].target = "http://openehr.org/fhir/StructureDefinition/{model}|0.1.0-snapshot"

RuleSet: OpenEHRExtensionGroup(model, extension)
* group[+].source = "http://openehr.org/fhir/StructureDefinition/{model}|0.1.0-snapshot"
* group[=].target = "http://hl7.org/fhir/StructureDefinition/{extension}|5.4.0"

RuleSet: FHIRExtensionGroup(extension, model)
* group[+].source = "http://hl7.org/fhir/StructureDefinition/{extension}|5.4.0"
* group[=].target = "http://openehr.org/fhir/StructureDefinition/{model}|0.1.0-snapshot"

RuleSet: ModelElement(source, target, fidelity, maturity, scope, table, note)
* group[=].element[+].code = #"{source}"
* insert ModelTarget({target}, {fidelity}, {maturity}, {scope}, {table}, [[{note}]])

RuleSet: ModelTarget(target, fidelity, maturity, scope, table, note)
* group[=].element[=].target[+].code = #"{target}"
* group[=].element[=].target[=].relationship = #related-to
* group[=].element[=].target[=].comment = "{note} See the [field table]({table}.html)."
* group[=].element[=].target[=].property[0].code = #fidelity
* group[=].element[=].target[=].property[0].valueString = "{fidelity}"
* group[=].element[=].target[=].property[1].code = #maturity
* group[=].element[=].target[=].property[1].valueString = "{maturity}"
* group[=].element[=].target[=].property[2].code = #scope
* group[=].element[=].target[=].property[2].valueString = "{scope}"

RuleSet: ModelCondition(condition)
* group[=].element[=].target[=].property[3].code = #condition
* group[=].element[=].target[=].property[3].valueString = "{condition}"

RuleSet: UnmappedModelElement(source, reason)
* group[=].element[+].code = #"{source}"
* group[=].element[=].noMap = true
* extension[http://hl7.org/fhir/StructureDefinition/note][+].valueAnnotation.text = "`{source}`: {reason}"
