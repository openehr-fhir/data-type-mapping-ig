
# Data Type Mappings



## FHIR Identifier / DV_IDENTIFIER

| FHIR.Identifier | openEHR.DV_IDENTIFIER | Map        | Comments |
| ---             | ---                   | ---        | ---    |
| use             |                       | `modeling` | usually used for categorization |
| period          |                       | `modeling` | is anybody using that? |
| assigner        | assigner              |            | DV_IDENTIFIER.assigner -> Identifier.assigner.display reverse Identifier.assigner(.reference, .display) -> DV_IDENTIFIER.assigner |
| type            | type                  |            | to discuss, could also just use FHIR codes into string so we don’t have to change the coding. (most likely irrelevant). (BE: DV_IDENTIFIER.type = Identifer.type.text; no coding)|
| value           | id                    |            |  |
| system          | issuer                |            | DV_IDENTIFIER.issuer - problem is URI we cannot transform in case of failure use a placeholder (openehr.org/placeholder) |

Notes:
* There is a conceptual difference in expectations around `identifier` usage in the systems.
* *Generally* openEHR uses the internal record id for referencing everything and expects external mapping where necessary.
* *Generally* FHIR includes many identifiers and thus needs categorization elements (`use`, `period`)

ToDo:
* [ ] Build a small cluster archetype that can be used to fully map
* [ ] Describe the two scenarios (using the cluster vs. using existing)


## DV_TEXT

| Field Name | Action     | Reason                             |
|------------|------------|------------------------------------|
| encoding   | DROP       |In case we have to keep this. Add note that if ppl use UTF-7 they are responsible to transform it to UTF-8. |
| hyperlink  | DROP       | included in markdown if wanted |
| language   | DISCUSSION | maps to either  https://build.fhir.org/ig/HL7/fhir-extensions/StructureDefinition-translation.html or |
| value | |  |
| formatting | TODO | **Formatting needs to be extended for xhtml.** |

### Formatting
Formatting depends on either if its data type string or markdown that is mapped. 

There might be the case where an string is extended to an markdown via an [standardized extension](https://build.fhir.org/ig/HL7/fhir-extensions/StructureDefinition-rendering-markdown.html). If this extension is contained either via modeling a new field is to be added. If not the original value is the one to be mapped (usually string). 

### Language
Language extensions in FHIR:
    * [Language](https://build.fhir.org/ig/HL7/fhir-extensions/StructureDefinition-language.html)
    * [Translation](https://build.fhir.org/ig/HL7/fhir-extensions/StructureDefinition-translation.html)
    * [Narrative Language Control](https://build.fhir.org/ig/HL7/fhir-extensions/StructureDefinition-narrative-language-control.html)
    * **TODO: GINO find the other extension.**
    
Introduce Cluster for narrative to openEHR, for the extension slot of Composition. When modeling keep in mind the narrative language control. **-> Modeling Team**

## TERM_MAPPING

* FHIR Extension [alternate-codes](https://build.fhir.org/ig/HL7/fhir-extensions/StructureDefinition-alternate-codes.html).
Can be used for string and code. 


## FHIR CodeableConcept

| Field Name        | Action     | Reason                                                                 |
|-------------------|------------|------------------------------------------------------------------------|
| system            | DISCUSSION | terminology name, how do we transform http and namespace    standardized namespace mappings otherwise                            |
| match     | DISCUSSION | there could be a case @diego made some examples                        |
| purpose   | DISCUSSION | would be something for FHIR, standardized extension to add purpose     |

**codeableconcept discuss how we make codeableconcept less clunky in openEHR**


| Description | Shape | Result | 
| ----------- | ----- | ------ | 
| Text only | `value.text` = `Broken Arm` | Use `DV_TEXT` |
| Coding Only | `value.coding[0].system` = `http://snomed.info/sct` <br /> `value.coding[0].code` = `23406007` <br /> `value.coding[0].display` = `Fracture of upper limb (disorder)` | Use `DV_CODED_TEXT` with selected code |
| Both | ... | Use `DV_TEXT` with `TERM_MAPPINGS` | 


* Text Only:
    * Use a `DV_TEXT` for the value
* Coding Only: First (or `userSelected` or based on perference of the server (e.g., prefer SNOMED))
    * `FHIR.CodeableConcept.coding.system` and `FHIR.CodeableConcept.coding.version` - `openEHR.DV_CODED_TEXT.CODE_PHRASE.terminology_id`
        * `coding.system` + `coding.version` <-> `terminology_id`
            * `http://hl7.org/fhir/encounter-status` + `5.0.0` -> `http://hl7.org/fhir/encounter-status|5.0.0`
            * `http://hl7.org/fhir/encounter-status` + `5.0.0` -> `http://hl7.org/fhir/encounter-status(5.0.0)`
            * Need to determine which format
            * Note this is mandatory in `DV_CODED_TEXT`
                * If we do not have a value, what do we do?
                    * If there is a way to implicitly know from FHIR, the mapping process must add it
                    * If thers is *no* way to know in FHIR, we need a default value
                        * ? Use the path to the element
                        * ? Use the resource ID
                        * ? Use the FHIR server base URL
                        * ? Use a generic value
    * `FHIR.CodeableConcept.coding.code` - `openEHR.DV_CODED_TEXT.CODE_PHRASE.code_string` (defining code)
        * Mandatory in `DV_CODED_TEXT`
            * If we do not have a value, what do we do? (same question as with `system`)
        * Are there primitive type restrictions (e.g., allowed characters)
            * Note that there is no restriction in openEHR about leading/trailing whitespace or internal whitespace
            * Propose adding matching restriction to openEHR
    * `FHIR.CodeableConcept.coding.display` - `openEHR.DV_CODED_TEXT.CODE_PHRASE.preferred_term`
    * `FHIR.CodeableConcept.coding.userSelected` - use `openEHR.TERM_MAPPING.purpose` for `user selected`
        * Propose adding additional code to the `purpose` value set to openEHR.
    * Any additional `coding` values map via `openEHR.TERM_MAPPING`
* Both text and coding(s): 
    * Use a `openEHR.DV_TEXT` for the `CodeableConcept.text` (per Text Only)
    * **ALL** `FHIR.CodeableConcept.coding` values in `openEHR.TERM_MAPPING` (per additional codings in Coding Only)
* In `openEHR.TERM_MAPPING`, there is mandatory `match`, that is equivalent to `FHIR.ConceptMap.group.element.target.relationship`
    * `TERM_MAPPING.match`
        * Relationships between terms - *could* be described in a `ConceptMap`, but *should* be handled by Tx
    * Decision: does not need to be in every FHIR resource, so no need for extension
        * Need to describe how to find the information from terminology services
    * Prior:
        * Propose adding a standard extension to FHIR for `CodeableConcept.coding`
            * Establish relationships between this coding and another coding
            * Point to another `system` + `code`, add the `relationship` annotation
        * When parsing a `TERM_MAPPING`
            * Add the extension (above) to establish relationships
* `DV_CODED_TEXT.defining_code`
    * Equivalent to a binding in a profile
    * [Ext: Coding Purpose](https://build.fhir.org/ig/HL7/fhir-extensions/StructureDefinition-coding-purpose.html)
    * Choice (need to ask the community):
        * Use `coding.userSelected`
        * Use `http://hl7.org/fhir/coding-purpose`#`original`
        * Request `http://hl7.org/fhir/coding-purpose`#`defining_code`
    * Note: previously asked Brett to file THO ticket adding `defining_code`
* `DV_CODED_TEXT.purpose`
    * Existing: https://build.fhir.org/ig/FHIR/openehr-base-ig/ValueSet-term-mapping-purpose.html
    * Choice (need to ask the community):
        * Add to `http://hl7.org/fhir/coding-purpose`
        * Use values from `https://specifications.openehr.org/fhir/codesystem-term_mapping_purpose`
    * Note: the existing LM for [TERM_MAPPING](https://build.fhir.org/ig/FHIR/openehr-base-ig/StructureDefinition-TERM-MAPPING.html) is defined as a `required` binding, this is incorrect


## DV_INTERVAL

| Field Name       | Action     | Reason                                                  |
|------------------|------------|---------------------------------------------------------|
| lower_unbounded  | DISCUSSION | is it just enough to be bounded, are we overengineered? |
| upper_unbounded  | DISCUSSION |      "                                                   |
| lower_included   | DISCUSSION |       "                                                  |
| upper_included   | DISCUSSION |     "                                                    |

* To Analyze
    * Compare when `*_unbounded` are used and what types they map to
    * Determine when `*_included` are used and what types they map to
* Data Types
    * Date/Time Values
        * Map to FHIR.Period
            * Period is *inclusive* only
            * This should only be an issue at design time - need to describe equivalent profiling constraints with FHIRPath
        * If other comparators are necessary, mapping needs to be done to multiple elements
    * Integer and Decimal Values
        * Map to FHIR.Range by default 
            * Range is *inclusive* only (defined with `SimpleQuantity` elements)
            * This should only be an issue at design time - need to describe equivalent profiling constraints with FHIRPath
        * If other comparators are necessary, mapping needs to be done to multiple elements
    * Quantity Values (includes Unit in FHIR)
        * Map to FHIR.Quantity
        * Use `comparator` to represent `inclusive` state
* Note: `DV_INTERVAL` should generally map to FHIR elements that have choices of types (e.g., `Observation.value[x]`)


## DV_QUANTITY

| Field Name          | Action     | Reason                                                                 |
|---------------------|------------|------------------------------------------------------------------------|
| precision           | DISCUSSION | http://hl7.org/fhir/StructureDefinition/quantity-precision                                       |
| unit/system/display | DISCUSSION | why didn’t unit use coding and have single fields                      |
| normal_range        | DISCUSSION | we need to map it to observation https://www.hl7.org/fhir/observation.html — here we need to see how this aligns |
| reference_range     | DISCUSSION | text is missing, we need it for non-numericals + if it comes with a text for interpretation it is missing |
| interpretation      | DISCUSSION | maybe extend DV_QUANTITY to cover interpretation too                   |
| age / appliesTo     | DISCUSSION | to add this for reference range, e.g. this ref range applies to 10–15 years old etc. |
| comparator          | DISCUSSION | is this still needed, we support more fields. Unsupported ones:<br> "=" : magnitude is a point value<br> "~" : value is approximately magnitude<br> "ad": FHIR added this in R6 — do we need this |

* `DV_QUANTITY.precision`
    * Use standard FHIR extension: [http://hl7.org/fhir/StructureDefinition/quantity-precision](https://build.fhir.org/ig/HL7/fhir-extensions/StructureDefinition-quantity-precision.html)
    * Integer values >= 0 are the same. openEHR has a -1 for unlimitied precision, which would be equivalent to leaving the precision off (?).
* Units
    * `DV_QUANTITY.units` - `Quantity.code`
    * `DV_QUANTITY.units_system` - `Quantity.system`
    * `DV_QUANTITY.units_display_name` - `Quantity.unit`
    * If no system is declared in openEHR, we can generally assume it is UCUM
    * If no system is declared in FHIR, we can generally assume it is UCUM
* `DV_QUANTITY.normal_status`
    * Maps to `Observation.interpretation` (is only valid in situations where a `normal_range` is present, which should always be in the context of an observation)
    * Note that if we want to have an extension for `referenceRange`, we would also need an extension for this status
    * Note that `Observation.interpretation` has a broader binding and is extensible, so the reverse mapping can have challenges - filing ticket on openEHR to make the binding extensible
    * Note that we need to determine the links in the code systems for our own sanity, e.g.
        * https://specifications.openehr.org/fhir/codesystem-normal_statuses <-> v2 code system
* `DV_QUANTITY.magnitude_status`
    * Maps to `Quantity.comparator`
        * `DV_QUANTITY.magnitude_status` has `~` for approximate with no equivalent
            * Todo(gino): ask if we should add this
        * `Quantity.comparator` has `ad` - what is this?
            * Todo(gino): ask what `ad` means and how it is used (is it approximate)?
* `DV_QUANTITY.accuracy`
    * Does not appear to be used - will ask on the openEHR side
    * FHIR: Use the `http://hl7.org/fhir/StructureDefinition/quantity-accuracy` extension on `Quantity`
        * https://build.fhir.org/ig/HL7/fhir-extensions/StructureDefinition-quantity-accuracy.html
        * Note that `accuracy_is_percent` needs to be false or the value needs to be converted
* `DV_QUANTITY.magnitude` <-> `Quantity.value`

* Reference ranges, normal + other
    * `DV_QUANTITY.normal_range`
        * Only used in `Observations`, most common is labs
        * Can be used as constraints in profiles, if the concept is for limiting content or data quality
        * Map to `Observation.referenceRange` with `type` of `normal`
    * `DV_QUANTITY.other_reference_ranges`
        * Only used in `Observations`, most common is labs
        * Can be used as constraints in profiles, if the concept is for limiting content or data quality
        * Map to `Observation.referenceRange` with `type` != `normal`
            * Pulls from `DV_QUANTITY.other_reference_ranges.meaning`
    * Gino: ask OO if [`Observation.referenceRange`](https://build.fhir.org/observation-definitions.html#Observation.referenceRange) should be made into a MetaDataType so that it is accessible in other resources (e.g., via extension)
        * Not necessary so far - willing to re-review during R6 ballot process
    * General expectation is that anything that has a `normal` in openEHR will map to an Observation
    * Mapping will be based on structures instead of just data types
    * Note that this handling is specific to DV_AMOUNT and should be applied to any openEHR type that derives from it


## DV_ORDERED

Abstract data type, nothing we need to do.

## DV_ORDINAL & DV_SCALE

| Field Name              |   Action   | Reason             |
|-------------------------|------------|--------------------|
| normal_status           | Archetype  |                    |
| normal_range            | Archetype  |                    |
| other_reference_ranges  | Archetype  |                    |
| symbol                  | DISCUSSION |                    |
| value                   | DISCUSSION |                    |

* Looking at `Observation.component` as base ([APGAR Example](https://build.fhir.org/observation-example-5minute-apgar-score.json.html))
    * `DV_*.symbol` (`DV_CODED_TEXT`) maps to/from
        * `Observation.component.valueCodeableConcept`/`...valueCoding`/`...valueCode`
        * `QuestionnaireResponse.item.answer.valueCoding`
            * or may need to be resolved via terminology from the value (e.g., use the code of the value decimal to get the Loinc code)
    * `DV_*.value` (`decimal`) maps to/from
        * `Observation.component.valueDecimal` or `valueQuantity`
        * `Observation.component.valueCoding` with [Item Weight Extension](https://build.fhir.org/ig/HL7/fhir-extensions/StructureDefinition-itemWeight-definitions.html)
        * `QuestionnaireResponse.item.answer.valueDecimal`/`...valueQuantity`
            * or may need to be resolved via terminology from the coded value (e.g., use the Loinc code to get a decmial - https://loinc.org/LL386-4)
* Range information is mapped at the archetype level

Note from IAN: Eqauates to ItemWeight extension https://build.fhir.org/ig/HL7/fhir-extensions/StructureDefinition-itemWeight-definitions.html



## FHIR MoneyQuantity / Money

| Field Name | Action     | Reason                              |
|------------|------------|-------------------------------------|
| all fields | DISCUSSION | we should do a cluster archetype    |

* Ian will investigate, but likely can just map `MoneyQuantity` bi-directionally with `DV_QUANTITY`
* `Money` appears to map just as easlity to `DV_QUANTITY`
    * `Money.value` <-> `DV_QUANITTY.magnitude`
    * `Money.currency` <-> `DV_QUANTITY.units` + `DV_QUANTITY.units_system`
* Likely worth creating a small cluster archetype to see how it works, but straightforward


## FHIR SimpleQuantity

| Field Name | Action | Reason       |
|------------|--------|--------------|
| all fields | MAPS   | maps DV_Quantity |

* FHIR Type is just a Quantity that cannot include a comparator
* Map the same way that DV_QUANTITY maps to FHIR.Quantity
    * There *should not* be a comparator in openEHR in any fields that map here
    * If there is, there is a modelling issue that needs to be corrected
    * Expectation that this is a mapping error that should not be processed.
    * If it does end up happening, we will revisit to see if there is something we missed.


## DV_COUNT

| Field Name | Action | Reason       |
|------------|--------|--------------|
| all fields | MAPS   | same mapping as Quantity |

* Can map (same as FHIR.Quantity mappings):
    * FHIR.Count.value <-> DV_COUNT.magnitude
    * FHIR.Count.comparator <-> DV_COUNT.mangnitude_status
    * openEHR additional properties (e.g., ranges, statuses) are part of Archetype mappings


## DV_PROPORTION

| Field Name | Action     | Reason                                                        |
|------------|------------|---------------------------------------------------------------|
| type       | DISCUSSION | how to transform that to FHIR / does FHIR adapt?              |
| precision  | DISCUSSION | can we make this implicit or should we keep it explicit

* Map DV_PROPORTION <-> FHIR.Ratio
    * DV_PROPORATION.numerator <-> Ratio.numerator
    * DV_PROPORATION.denominator <-> Ratio.denominator
    * DV_PROPORATION.type handling
        * `pk_ratio`: maps normally
        * `pk_unitary`: numerator maps normally, denominator is 1
        * `pk_percent`: numerator maps normally, denominator is 100
        * `pk_fraction`: numerator and denominator map normally, need to determine how to convey formatting info
        * `pk_integer_fraction`: numerator and denominator map normally, need to determine how to convey formatting info
    * Use the DV_AMOUNT mapping policy/process for everything else
* Additional archetype mapping is needed where there is one or two units present in FHIR, since the openEHR datatype does not handle units but archetypes do that in a explicit field. 
    * Ratio includes them in the numerator and denominator
    * DV_PROPORTION are just the decimal values
    * Note that in openEHR this is typically represented in two DV_QUANTITY values instead
* In general it would be useful that we define a standardized mapping for the DV_AMOUNT so we can point to that mapping for normal_range, other_reference_ranges. (TODO for when we revisit the mappings)

* TODO: Gino: look in FHIR for how to represent the `pk_fraction` and `pk_integer_fraction` formatting info, may need to define a new extension



## DV_TEMPORAL: DV_DATE, DV_TIME, DV_DATETIME

| Field Name       | Action | Reason |
|------------------|--------|--------|
| accuracy         | DROP   |        |
| magnitude_status | DROP   |        |

* Difference is DV_TEMPORAL are complex types vs. FHIR date, time, and dateTime are primitives
* Need to review the openEHR usage of ISO-8601 compared to the allowed subset in FHIR
* openEHR compact forms need to be expanded to the extended form
* Note that FHIR.time *cannot* have a time zone and openEHR.DV_TIME does
    * Need to review if this happens in practice 
    * In FHIR, use the [timezone](https://build.fhir.org/ig/HL7/fhir-extensions/StructureDefinition-timezone.html) extension
* FHIR.time/dateTime allow up to 9 decimal places in fractional seconds, openEHR restricts to 3
    * *Should* be able to ignore the additional precision, will attempt to verify the use that asked for them
* The rest of the DV_AMOUNT/etc. properties (e.g., accuracy, magnitude) can all be dropped



## DV_DURATION

| Field Name       | Action     | Reason                                                   |
|------------------|------------|----------------------------------------------------------|
| value            | KEEP       |                                                          |
| other fields     | DROP       | DROP DV_QUANTITY fields except value                     |
| accuracy         | DROP       |                                                          |
| magnitude_status | DROP       |                                                          |
| units            | DISCUSSION | we use ISO8601, FHIR uses UCUM — how to align these?     |


* DV_DURATION -> FHIR.Duration
    * Need to do the conversion between ISO8601 duration to UCUM
* FHIR.Duration -> DV_DURATION
    * Convert UCUM to ISO8601
    * Note that some precision may be lost (e.g., sub-miliseconds)
* Plan to document the detailed conversions and create reference library (Severin?)
* Note that even within UCUM date/time conversions are tricky: https://ucum.org/ucum#para-31
* The rest of the DV_AMOUNT/etc. properties (e.g., accuracy, magnitude) can all be either archetype mapped or dropped (see: Quantity discussion)
    * It is unlikely that any exist beyond restrictions in modeling
* DV_DURATION -> FHIR.Timing
    * This is for the complicated usages (e.g., dosage, treatment plans, etc.)
    * Note there are three Archetypes that have this info
        * DAILY_TIMING, NON_DAILY_TIMING, 

### UCUM Duration → ISO 8601
> ISO 8601 duration pattern: `P[nY][nM][nW][nD][T[nH][nM][nS]]`

based on https://build.fhir.org/valueset-duration-units.html

| UCUM Unit | ISO 8601 Format Example | Description |
|----------|--------------------------|-------------|
| `ms` | `PT0.001S` | Milliseconds  |
| `s` | `PT00S` | Seconds |
| `min` | `PT00M` | Minutes |
| `h` | `PT00H` | Hours |
| `d` | `P00D` | Days |
| `wk` | `P00W` | Weeks  |
| `mo` | `P00M` | Months |
| `a` | `P00Y` | Years |


## DV_MULTIMEDIA

| Field Name     | Action          | Reason                                              |
|----------------|-----------------|-----------------------------------------------------|
| all fields     | LOW PRIORITY    | therefore skipped                                   |
| compression    | DROP/RECOMMEND  | drop constraint or make it a recommendation         |
| representation | DISCUSSION      | CODED or STRING                                     |

* DV_MULTIMEDIA -> FHIR.Attachment
    * status and range fields are nonsensical here and can be dropped
    * `charset`
        * If this is about data local to the content, it needs to be converted to UTF-8
        * If this is about the attachment data, the value moves into the MIME type as a parameter
            * See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/MIME_types for charset parameter details
    * DV_MULTIMEDIA.language -> Attachment.languange
    * DV_MULTIMEDIA.alternate_text -> Attachment.title
    * DV_MULTIMEDIA.uri -> Attachment.url
    * DV_MULTIMEDIA.data -> Attachment.data
    * DV_MULTIMEDIA.media_type -> Attachment.contentType
    * DV_MULTIMEDIA.compression_algorithm -> *no equivalent*, need either new element or extension on Attachment
    * DV_MULTIMEDIA.integrity_check & altgorithm -> Attachment.hash, but only for SHA-1
        * TODO(Gino): file ticket to expand attachment, add the algorithm: `hashAlgorithm` 0..1 coding, extensible
    * DV_MULTIMEDIA.thumbnail -> *no equivalent*, looks like there might be a usable extension already
        * https://build.fhir.org/ig/HL7/fhir-extensions/StructureDefinition-documentreference-thumbnail.html
        * Would need to expand the context to allow Attachment
        * Need to see if there are equivalents in the resources already (e.g., where it is used)
    * DV_MULTIMEDIA.size -> Attachment.size
* FHIR.Attachment -> DV_MULTIMEDIA
    * Attachment.creation, height, width, frames, duration, pages
        * Either mapped to the relevant archetype, or dropped


## DV_PARSABLE

| Field Name | Action            | Reason                                                                 |
|------------|-------------------|------------------------------------------------------------------------|
| value      | INTERNAL DISCUSSION | IAN: checks how the semitransformable strings in Variant Call Format in FHIR |

* DV_PARSABLE -> FHIR.string
    * Most common of any remaining existing use
    * Attach the http://hl7.org/fhir/StructureDefinition/mimeType extension to represent
    * A.MedicationOrder -> ignore
    * A.GenomicVariant -> GA4GH where it uses HGVS
        * In FHIR there is a common style of CodeableConcept.text use
        * See: https://build.fhir.org/ig/HL7/genomics-reporting/
* FHIR.string -> DV_PARSABLE
    * Not likely, but make sure to note the format if applicable
* Note that if it is present, the most common format is Markdown
    * Should map to an appropriate FHIR element if possible, see other discussion in doc


## NULL_FLAVOUR

| Field Name | Action     | Reason                                                  |
|------------|------------|---------------------------------------------------------|
| code       | DISCUSSION | Relax the code constraint so people can also use FHIR?  |

* NULL_FLAVOR -> http://hl7.org/fhir/StructureDefinition/data-absent-reason
    * 271:no information -> 
    * 253:unknown -> `unknown`
    * 272:masked -> `masked`
    * 273:not applicable -> `not-applicable`
* NULL_FLAVOR -> http://hl7.org/fhir/StructureDefinition/iso21090-nullFlavor
    * 271:no information -> `NI`
    * 253:unknown -> `UNK`
    * 272:masked -> `MSK`
    * 273:not applicable -> `NA`

* TODO(gino): check with some national-level IGs to make sure they are using DAR (or if using NullFlavor)
    * https://chat.fhir.org/#narrow/channel/179280-fhir.2Finfrastructure-wg/topic/Null.20Flavour.20vs.20Data.20Absent.20reason/with/210939015
    * General advice is to use DAR, null flavor is supported
* Will write ConceptMaps to transform to/from each system
* openEHR will support both fhir ValueSets in the future for NULL_FLAVOURS backtransformation can be based then on the CodeSystem used if its either dataAbsent of NullFlavour


## LINK


| Topic     | Action     | Details                                                                |
|-----------|------------|------------------------------------------------------------------------|
| meaning   |            | Context that is provided by element in a resource or profile |
| type      |            |  |
| target    |            | |

* LINK to Reference
* LINK to CodeableReference


- The FHIR reference is combining the openEHR LINK and PARTY_IDENTIFIED from its logic. 
    - Only usable for participants, maps well to 
Also there is a CodableReference in FHIR. 
- OpenEHR needs to investigate the possibility to merge parts of this concepts into a common RM class

## DV_EHR_URI


## TODO for Modeling Group

------
**THIS IS WHERE WE STOPPED** (still discussing)

| Topic     | Action     | Reason                                                                 |
|-----------|------------|------------------------------------------------------------------------|
| EVENT     | DISCUSSION | Two choices: use point event + terminology saying 24h blood pressure OR map DV_INTERVAL from codings, which is a lot of work |
| TIMING    | TODO       | (Not yet detailed)                                                    |
| MEDIAFILE | TODO       | (Not yet detailed)                                                    |
| ENCOUNTER | DISCUSSION | Add fields to composition to uniquely address encounter; Add archetype for Encounter |



