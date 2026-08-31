# Installation

To build this Implementation Guide locally you will need the following
components.

## Java

[Download Java](https://adoptium.net/)

Any JRE 8 or higher will work, but we recommend **JDK 11 or higher** — 2 GB of
heap is sometimes not enough for an IG with a lot of content. Java runs the
HL7 FHIR IG Publisher, XSLT transforms over XML files, and PlantUML image
generation.

To check what you have installed:

```
java -version
```

## Node.js

[Download Node.js](https://nodejs.org/en/)

Node.js is required by SUSHI (below).

## SUSHI

[SUSHI](https://github.com/FHIR/sushi) is the processing engine for FHIR
Shorthand (FSH). It compiles the `.fsh` files in `input/fsh/` into FHIR
resources and generates the `ImplementationGuide` resource.

Install it globally once Node.js is present:

```
npm install -g fsh-sushi
```

Check the installed version with:

```
sushi --version
```

## Ruby and Jekyll

[Download Ruby](https://www.ruby-lang.org/en/downloads/)

Ruby and Jekyll are needed for the IG Publisher to render pages locally. They
are not required if you rely only on the HL7 `build.fhir.org` CI environment,
but local builds are much faster to iterate on.

Once Ruby is installed:

```
gem install bundler jekyll
```

## HL7 FHIR IG Publisher

The [IG Publisher](https://github.com/HL7/fhir-ig-publisher) turns the contents
of this repository into the published website. It is **not** checked in.

Fetch (or update) it with:

```
_updatePublisher
```

That downloads the latest `publisher.jar` into `input-cache/`. The build
scripts also accept it in the parent directory (`..\publisher.jar`).

## Run a build

```
_genonce
```

The rendered guide is written to `output/`. Open `output/index.html` to read it
and `output/qa.html` for the QA report.

For a fast FSH-only check that skips the publisher entirely:

```
sushi .
```
