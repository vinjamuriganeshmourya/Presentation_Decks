import type { SlideDef, DeckMeta } from '@/deck/types'
import {
  BoundaryBridge,
  CodeBlock,
  CodeOutput,
  FanOut,
  ObjectStateRow,
  StateChange,
  SpineFlow,
  LaneFlow,
  StepLedger,
  CircuitMap,
  GateFlow,
  TrackSwitch,
  FileTree,
  SwapRows,
  Terminal,
  ThreeLanes,
  TillRow,
  QUEUE_FIXTURE,
  NestedBoundary,
  LogoWall,
  RadialSpread,
  PromptCard,
  ValueTypeMap,
  VariableTrace,
  EvalSteps,
} from '@/ui'
import type { FlowchartFigureProps } from '@/ui'
import {
  WelcomeSlide,
  RecapSlide,
  AgendaSlide,
  SectionBreakerSlide,
  SectionBreakerImageSlide,
  ContentSlide,
  ContentLeftImageSlide,
  ContentRightImageSlide,
  ContentTopImageSlide,
  ContentBottomImageSlide,
  ContentNoteSlide,
  FlowChartSlide,
  OnlyImageSlide,
  ProceduralStepsSlide,
  ScenarioSlide,
  QuestionSlide,
  QuestionPointsSlide,
  CodeSyntaxSlide,
  CommandSyntaxSlide,
  CodeBuildSlide,
  StatusPointsSlide,
  ConversationSlide,
  ChatSlide,
  ChatCharacterSlide,
  QuizTimeSlide,
  BrandSlide,
  KeyTakeawaysSlide,
  PracticeSlide,
  FeedbackSlide,
  ThankYouSlide,
  NextSessionSlide,
} from '@/slides'
import {
  BeatStory as GalleryBeatStory,
  ChallengePanel as GalleryChallengePanel,
  CodeBlock as GalleryCodeBlock,
  Countdown as GalleryCountdown,
  CrossList as GalleryCrossList,
  ExamplesToShape as GalleryExamplesToShape,
  MatchPairs as GalleryMatchPairs,
  OutputPanel as GalleryOutputPanel,
  PseudoShape as GalleryPseudoShape,
  RangeCall as GalleryRangeCall,
  RangeArg as GalleryRangeArg,
  RangeCells as GalleryRangeCells,
  RangeDial as GalleryRangeDial,
  Row as GalleryRow,
  RunCompare as GalleryRunCompare,
  SavingsStory as GallerySavingsStory,
  SlideBase as GallerySlideBase,
  StoryArt as GalleryStoryArt,
  StringWalker as GalleryStringWalker,
  TakeawayTree as GalleryTakeawayTree,
  TracePanel as GalleryTracePanel,
  VarTrail as GalleryVarTrail,
  ZonedFrame as GalleryZonedFrame,
} from '@/ui'

export const sampleMeta: DeckMeta = {
  title: 'Introduction to REST APIs',
  course: 'Backend Development',
  lesson: 'REST APIs',
  presenter: 'NxtWave Instructor',
  /* The control bar fades out when nothing is touched and comes back on a tap,
     as every Python-course deck from session 18 to 31 ran it. The kit decks set
     it too (2026-10-14) so a deck copied from them matches, and so
     `autohide-check.mjs` means the same thing here as in a session. */
  player: { autoHideControls: true },
}

const FOOTER = 'REST APIs · Backend'

const serializerCode = `from rest_framework import serializers
from .models import Product

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ["id", "name", "price", "in_stock"]`

/**
 * The sample deck — a complete lesson that demonstrates every slide type in
 * the template. Duplicate this file and edit the array to build a new lesson.
 */
const viewCode = `from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Product
from .serializers import ProductSerializer

@api_view(["GET"])
def product_list(request):
    products = Product.objects.all()
    data = ProductSerializer(products, many=True).data
    return Response(data)`


/*
  ONE PROCESS, RENDERED BY ALL SIX FLOW-CHART FIGURES.

  Deliberately a general process rather than a REST one: these figures go into
  every deck, and a fixture dressed in this lesson's content would be judged on
  how well it renders this lesson. It stresses every case the older `FlowChart`
  cannot draw: a decision written as a QUESTION with BOTH exits labelled, an
  exception branch, and a loop back to an earlier step.
*/
const reviewFlow: Pick<FlowchartFigureProps, 'nodes' | 'edges'> = {
  nodes: [
    { id: 'submit', kind: 'start', label: 'Work submitted', caption: 'the learner clicks send', icon: 'rocket', lane: 'Learner', detail: 'Nothing is checked yet. The work is queued and the learner gets an id they can quote.' },
    { id: 'checks', kind: 'step', label: 'Automated checks run', caption: 'format, tests, limits', icon: 'bolt', lane: 'Grading service', detail: 'Formatting, the test suite, and the size limit. Minutes, not hours, and it runs unattended.' },
    { id: 'gate', kind: 'decision', label: 'All checks pass?', icon: 'target', lane: 'Grading service', detail: 'The only automatic decision in the process. Everything after it is a person.' },
    { id: 'review', kind: 'step', label: 'A reviewer reads it', caption: 'judgement, not rules', icon: 'eye', lane: 'Reviewer', detail: 'A human reads for judgement: is the approach sound, not merely does it run.' },
    { id: 'fix', kind: 'step', label: 'Fix and resubmit', caption: 'as many times as needed', icon: 'pencil', lane: 'Learner', detail: 'The loop with no counter. A submission can come back through here any number of times.' },
    { id: 'done', kind: 'end', label: 'Marked complete', caption: 'feedback published', icon: 'check', lane: 'Reviewer', detail: 'Feedback is published and the attempt is closed. The loop cannot be re-entered.' },
  ],
  edges: [
    { from: 'submit', to: 'checks', kind: 'main' },
    { from: 'checks', to: 'gate', kind: 'main' },
    { from: 'gate', to: 'review', label: 'Yes', kind: 'main' },
    { from: 'gate', to: 'fix', label: 'No', kind: 'alt' },
    { from: 'fix', to: 'checks', label: 'run again', kind: 'loop' },
    { from: 'review', to: 'done', kind: 'main' },
  ],
}

const FLOW = { ...reviewFlow, caption: 'The straight run is four steps. Everything else is the loop.' }

export const sampleDeck: SlideDef[] = [
  {
    id: 'brand',
    label: 'Brand',
    transition: 'fade',
    notes:
      'THE OPENING FRAME. The mark and a greeting, nothing else: no session name, no course, no presenter. It carries no footer logo because the hero already is the logo, and two marks on one frame is the duplication rule 7 exists to stop. Keep the greeting SHORT and do not make it "Welcome to today\'s session": WelcomeSlide hardcodes that exact line as its kicker two slides later.',
    element: <BrandSlide greeting="Welcome!" lesson={FOOTER} />,
  },
  {
    id: 'sample-question',
    section: 'Slide types',
    label: 'Question',
    element: (
      <QuestionSlide
        question="If this image is rebuilt next month, does it install the same version?"
        qualifier="Assume nothing else about the project changed"
        lesson="Component Gallery"
      />
    ),
    notes:
      'THE PAUSE BEAT. One question, hero scale, optically centred, and nothing else on the slide. No bullets, no figure, no answer: the room answers out loud and the NEXT slide responds. A compound question gets split into two of these.',
  },
  {
    id: 'sample-question-choices',
    section: 'Slide types',
    label: 'Question · choices',
    element: (
      <QuestionSlide
        question="A container writes a file. The container is deleted and recreated. Is the file still there?"
        qualifier="Nothing else about the setup changes"
        choices={['Yes', 'No']}
        lesson="Component Gallery"
      />
    ),
    notes:
      'THE SAME PAUSE BEAT, WITH THE ANSWERS THE ROOM IS CHOOSING BETWEEN. `choices` takes two or three short strings and draws them as identical boxes under the question. It is FOR replacing the stage direction decks used to print as a bullet ("say yes or no before the next slide"), which told the room how to behave rather than showing it what it was picking. It must NOT carry a hint: the boxes are deliberately drawn the same, so never tint, tick, enlarge or order one of them to signal the answer, and never use it for more than three options. The answer is still the NEXT slide. Confusable with QuestionPointsSlide, which puts the ANSWER on the same frame as click-revealed points and is therefore the wrong type whenever the room is meant to commit first.',
  },
  {
    id: 'welcome',
    label: 'Welcome',
    transition: 'zoom',
    notes:
      'THE SESSION-NAME FRAME. `minimal` is the shipping form and the one the workflow specifies: the kicker "Welcome to today\'s session" plus the session name, centred, and NOTHING else in the body. No course chip, no presenter, no meta, no mascot, and no body logo, because the footer already carries the one mark. The full-bodied variant (course, subtitle, presenter, meta) still exists on the props type but no shipping deck uses it.',
    element: (
      <WelcomeSlide
        minimal
        title="Introduction to REST APIs"
        lesson={FOOTER}
      />
    ),
  },
  {
    id: 'recap',
    label: 'Recap',
    section: 'Warm-up',
    transition: 'slide',
    notes: 'Quick check that the ORM foundation is solid before layering APIs on top.',
    element: (
      <RecapSlide
        lesson={FOOTER}
        points={[
          { text: 'Models map Python classes to database tables', sub: 'via Django’s ORM' },
          { text: 'QuerySets let us read & filter rows lazily' },
          { text: 'Migrations version our schema over time' },
          { text: 'The admin site gave us CRUD for free' },
        ]}
      />
    ),
  },
  {
    id: 'agenda',
    label: 'Agenda',
    section: 'Warm-up',
    element: (
      <AgendaSlide
        lesson={FOOTER}
        items={[
          { title: 'What is a REST API?', sub: 'The vocabulary of the web' },
          { title: 'The request and response lifecycle', sub: 'What happens on every call' },
          { title: 'Django REST Framework', sub: 'Serializers, views and routing' },
          { title: 'Build an endpoint, step by step', sub: 'From model to JSON' },
        ]}
      />
    ),
  },
  {
    id: 'sec-1',
    label: 'Section · Concepts',
    section: 'Concepts',
    transition: 'cover',
    element: (
      <SectionBreakerSlide
        index={1}
        kicker="Section 1"
        title="What is a REST API?"
        subtitle="A shared language that lets a client ask a server for exactly what it needs."
      />
    ),
  },
  {
    id: 'fig-nested-boundary',
    label: 'NestedBoundary',
    section: 'Concepts',
    element: (
      <ContentSlide kicker="Figures" title="NestedBoundary" lead="Boxes inside boxes, the innermost solid. For a claim of the shape: this is stuck inside that" lesson="Gallery">
        <NestedBoundary className="mx-auto max-w-[840px]" />
      </ContentSlide>
    ),
    notes: 'FOR: containment, and what containment traps. Docker-inside-Docker is the default. MUST NOT carry a stack of peers, which is LayerStack, or an outsider trying to get in, which is MachineBoundary. CONFUSABLE WITH SocketBridge, its pair: the same two things side by side instead of nested. Show this one, then that one.',
  },
  {
    id: 'what-is-api',
    label: 'What is an API',
    section: 'Concepts',
    element: (
      <ContentSlide
        lesson={FOOTER}
        kicker="Core idea"
        title="An API is a contract between programs"
        lead="REST is the most common style for web APIs, built directly on top of HTTP."
        points={[
          { text: 'Resources are identified by URLs', sub: 'e.g. /api/products/42/', icon: 'target' },
          { text: 'Actions are expressed with HTTP verbs', sub: 'GET, POST, PUT, DELETE', icon: 'bolt' },
          { text: 'Communication is stateless', sub: 'each request stands alone', icon: 'arrow' },
          { text: 'Data usually travels as JSON', sub: 'lightweight & language-agnostic', icon: 'code' },
        ]}
      />
    ),
  },
  {
    id: 'content-split-default',
    label: 'Content · points beside a figure (default split)',
    section: 'Concepts',
    notes:
      'THE TWO-COLUMN MODE OF ContentSlide: pass BOTH `points` and children and the bullets and the figure sit side by side. This slide passes neither `split` nor `columnAlign`, so it is the historical rendering — the prose gets 1.4fr against the figure\'s 1fr (649px against 463px) and each column centres itself independently. Worst at: a figure that needs width. 463px is narrower than a `Terminal` line of any length, and `Terminal` wraps `break-words`, so it breaks an image name MID-TOKEN. Reach for `split="even"` there.',
    element: (
      <ContentSlide
        lesson={FOOTER}
        kicker="Two columns"
        title="Points beside a figure"
        lead="The bullets and the figure are one idea, so they arrive together."
        points={[
          { text: 'The list keeps the wider column', icon: 'target' },
          { text: 'The figure takes what is left', icon: 'bolt' },
          { text: 'Both animate on slide entry', icon: 'arrow' },
        ]}
      >
        <Terminal
          path="C:\ecommerce"
          lines={[
            { text: 'docker ps', kind: 'cmd' },
            { text: 'CONTAINER ID   STATUS', kind: 'out' },
            { text: 'a41f9c2b       Up 2 minutes', kind: 'out' },
          ]}
          caption="Short lines fit the narrow column"
        />
      </ContentSlide>
    ),
  },
  {
    id: 'client-server',
    label: 'Client–Server (right image)',
    section: 'Concepts',
    element: (
      <ContentRightImageSlide
        lesson={FOOTER}
        kicker="Mental model"
        title="Client asks, server answers"
        lead="Your mobile app or browser is the client; Django is the server."
        media={{ illustration: 'concept-api' }}
        caption="A single request/response round-trip"
        points={[
          { text: 'The client sends a request to a URL' },
          { text: 'The server does the work and responds' },
          { text: 'Every response carries a status code' },
        ]}
      />
    ),
  },
  {
    id: 'lifecycle',
    label: 'Request lifecycle (flow)',
    section: 'Concepts',
    transition: 'rise',
    notes:
      'A PROCESS WITH AN ORDER. Note what the colour does and does not do: the first and last nodes are FILLED because they are the two ends of the journey, and every station between them is a neutral white card on one accent because they are all the same kind of thing. Passing a per-node tone is still possible and marks one station out as different. It used to auto-assign a tone per position, which produced a five-colour rainbow encoding nothing. One continuous rail runs behind the row, and the arrows sit on it: that is what makes five cards read as one request travelling.',
    element: (
      <FlowChartSlide
        lesson={FOOTER}
        kicker="Under the hood"
        title="The request and response lifecycle"
        lead="What Django does with every API call."
        nodes={[
          { label: 'Client', caption: 'sends GET', icon: 'chat' },
          { label: 'URL Router', caption: 'urls.py', icon: 'route' },
          { label: 'View', caption: 'api_view', icon: 'code' },
          { label: 'Serializer', caption: 'builds JSON', icon: 'bolt' },
          { label: 'Response', caption: '200 OK', icon: 'check' },
        ]}
      />
    ),
  },
  {
    id: 'http-methods',
    label: 'HTTP methods (note)',
    section: 'Concepts',
    element: (
      <ContentNoteSlide
        lesson={FOOTER}
        kicker="Verbs"
        title="Four verbs cover most of REST"
        points={[
          { text: 'GET: read a resource', icon: 'arrow', tone: 'brand' },
          { text: 'POST: create a new resource', icon: 'arrow', tone: 'teal' },
          { text: 'PUT / PATCH: update a resource', icon: 'arrow', tone: 'accent' },
          { text: 'DELETE: remove a resource', icon: 'arrow', tone: 'info' },
        ]}
        note={{
          kind: 'tip',
          title: 'Keep GET safe',
          body: 'A GET request should never change server state. It is “safe”, so it can be retried or cached freely.',
        }}
      />
    ),
  },
  {
    id: 'question-points',
    label: 'Question + points',
    section: 'Concepts',
    notes:
      'THE PAUSE BEAT THAT ANSWERS ITSELF. At step 0 this is a QuestionSlide: the question and nothing else, so there is nothing to read instead of think. The points are BUILD STEPS and land only after the room has answered out loud, which is how it keeps content rule 16. Use QuestionSlide instead whenever the answer needs its own slide, a figure or a terminal. That is still the default.',
    element: (
      <QuestionPointsSlide
        lesson={FOOTER}
        question="Three apps need the same product list. How many times do you write the database query?"
        qualifier="Assume all three are built by different teams"
        points={[
          { text: 'Once, behind an API', sub: 'Every client asks the same URL' },
          { text: 'No client ever touches the database directly' },
          { text: 'Change the query in one place and all three follow' },
        ]}
      />
    ),
  },
  {
    id: 'conversation',
    label: 'Conversation (transcript)',
    section: 'Concepts',
    notes:
      'A TWO-VOICE EXCHANGE, SET AS A TRANSCRIPT. The dense form: speaker in the gutter, line beside it, full width for the words. Reach for it past four turns or past a dozen words a turn, where bubbles would run off the bottom of the frame. Exactly two voices, and the right-hand one is the voice the deck wants the room to leave in. Note that the name prints only when the speaker changes.',
    element: (
      <ConversationSlide
        lesson={FOOTER}
        kicker="Why an API"
        title="Why not just share the database?"
        speakers={{ left: 'Mobile dev', right: 'Backend dev' }}
        turns={[
          { side: 'left', text: 'Could you give the app the database password?' },
          { side: 'left', text: 'It would be one less network call.' },
          { side: 'right', text: 'Then every app carries a copy of your schema.' },
          { side: 'right', text: 'Rename one column and three apps break at once.' },
          { side: 'left', text: 'So the API is the contract?' },
          { side: 'right', text: 'Yes. The URL stays put, and the schema underneath stays free to change.' },
        ]}
      />
    ),
  },
  {
    id: 'chat',
    label: 'Chat (bubbles)',
    section: 'Concepts',
    notes:
      'THE SAME CONTENT AS A CONVERSATION SLIDE, DRAWN AS MESSAGES. Instantly legible as two people talking, at the cost of the empty column beside each bubble: five one-line turns, no more. Use it where the lesson IS a misconception being voiced and corrected, and the room needs to recognise itself in the first line. Two speakers who agree with each other are a BulletList in a costume.',
    element: (
      <ChatSlide
        lesson={FOOTER}
        kicker="Reading a response"
        title="A 404 is not a bug"
        speakers={{ left: 'Learner', right: 'Mentor' }}
        turns={[
          { side: 'left', speaker: 'Learner', text: 'GET /api/products/9 came back 404. Is the server broken?' },
          { side: 'right', speaker: 'Mentor', text: 'No. It understood you perfectly, and there is no product 9.' },
          { side: 'left', speaker: 'Learner', text: 'How do I tell that apart from a real failure?' },
          { side: 'right', speaker: 'Mentor', text: '4xx is you asking wrong. 5xx is the server falling over.' },
        ]}
      />
    ),
  },
  {
    id: 'chat-character',
    label: 'Chat with a character',
    section: 'Concepts',
    notes:
      'THE SAME THREAD, WITH NOVA BESIDE IT. The character gives the answering voice a face, which earns its place on the ONE slide in a concept where the exchange is the argument. On three chat slides in a row it is wallpaper, and rule 8 applies to characters too. Nova stands on the LEFT and faces right: the top right is held for the instructor video, and a character on that side would be gesturing off the edge of the slide. The column costs the thread 240px, so four short turns, not five.',
    element: (
      <ChatCharacterSlide
        lesson={FOOTER}
        kicker="Who does what"
        title="Where does the JSON come from?"
        speakers={{ left: 'Learner', right: 'Nova' }}
        turns={[
          { side: 'left', speaker: 'Learner', text: 'Who turns the model into JSON?' },
          { side: 'right', speaker: 'Nova', text: 'The serializer. It is the translator.' },
          { side: 'left', speaker: 'Learner', text: 'And who picks the status code?' },
          { side: 'right', speaker: 'Nova', text: 'Your view does, when it builds the Response.' },
        ]}
      />
    ),
  },
  {
    id: 'sec-2',
    label: 'Section · DRF (image)',
    section: 'DRF',
    transition: 'cover',
    element: (
      <SectionBreakerImageSlide
        index={2}
        kicker="Section 2"
        title="Django REST Framework"
        subtitle="The toolkit that makes building Web APIs fast, clean, and secure."
        media={{ illustration: 'concept-database' }}
      />
    ),
  },
  {
    id: 'serializers',
    label: 'Serializers (left image)',
    section: 'DRF',
    element: (
      <ContentLeftImageSlide
        lesson={FOOTER}
        kicker="The bridge"
        title="Serializers translate models ↔ JSON"
        lead="They’re the heart of DRF."
        media={{ illustration: 'concept-database' }}
        points={[
          { text: 'Convert querysets & instances → JSON' },
          { text: 'Validate incoming request data' },
          { text: 'ModelSerializer auto-builds the fields' },
        ]}
      />
    ),
  },
  {
    id: 'serializer-code',
    label: 'Serializer code',
    section: 'DRF',
    element: (
      <ContentSlide
        lesson={FOOTER}
        kicker="Code"
        title="A ModelSerializer in practice"
        lead="Declare the model and the fields, and DRF handles the rest."
      >
        <CodeBlock
          code={serializerCode}
          filename="products/serializers.py"
          language="python"
          highlight={[4, 6]}
        />
      </ContentSlide>
    ),
  },
  {
    id: 'build-steps',
    label: 'Build steps (procedure)',
    section: 'DRF',
    element: (
      <ProceduralStepsSlide
        lesson={FOOTER}
        kicker="Step by step"
        title="Build a read-only endpoint"
        lead="From a model to live JSON in five moves."
        steps={[
          { title: 'Define the model', detail: 'A Product with name, price, in_stock', icon: 'book' },
          { title: 'Create a serializer', detail: 'Subclass ModelSerializer', icon: 'bolt' },
          { title: 'Write the view', detail: 'Decorate with @api_view(["GET"])', icon: 'code' },
          { title: 'Register the URL', detail: 'Map /api/products/ to the view', icon: 'target' },
          { title: 'Test in the browsable API', detail: 'DRF gives you a UI for free', icon: 'play' },
        ]}
      />
    ),
  },
  {
    id: 'view-code',
    label: 'View code (top image)',
    section: 'DRF',
    element: (
      <ContentTopImageSlide
        lesson={FOOTER}
        kicker="Putting it together"
        title="The view returns a Response"
        media={{ illustration: 'concept-api' }}
        points={[
          { text: '@api_view wires the function into DRF' },
          { text: 'Response serializes data & sets the status' },
        ]}
      />
    ),
  },
  {
    id: 'scenario',
    label: 'Scenario',
    section: 'DRF',
    element: (
      <ScenarioSlide
        lesson={FOOTER}
        kicker="Scenario"
        title="Why this matters"
        persona="E-commerce team"
        situation="The new mobile app needs to show a live product catalogue to shoppers."
        beats={[
          { label: 'Situation', detail: 'The app has no direct database access.', icon: 'info', tone: 'brand' },
          { label: 'Action', detail: 'Expose GET /api/products/ with a DRF view + serializer.', icon: 'code', tone: 'teal' },
          /* 'renders the catalogue anywhere.' measured 293.16px against a 293px card at 1x
             and 439.73 against 440.84 at 1.5x: three lines at one zoom, two at the other,
             which fit-check rightly fails. Boundary copy, shortened (2026-10-14). */
          { label: 'Result', detail: 'The app fetches JSON and renders the catalogue.', icon: 'check', tone: 'success' },
        ]}
      />
    ),
  },
  {
    id: 'status-codes',
    label: 'Status codes (bottom image)',
    section: 'DRF',
    element: (
      <ContentBottomImageSlide
        lesson={FOOTER}
        kicker="Communicate outcomes"
        title="Status codes tell the client what happened"
        media={{ illustration: 'concept-api' }}
        points={[
          { text: '2xx: success (200 OK, 201 Created)', tone: 'success' },
          { text: '4xx: client error (404 Not Found)', tone: 'accent' },
          { text: '5xx: server error (500)', tone: 'info' },
        ]}
      />
    ),
  },
  {
    id: 'code-syntax',
    label: 'Code syntax',
    section: 'DRF',
    notes:
      'THE SHAPE OF A LANGUAGE CONSTRUCT, NOT ONE EXAMPLE OF IT. The specimen line is BUILT from the parts array, so the diagram and the legend under it cannot drift apart. Dashed underline plus the "you replace this" chip answers the first question every learner asks of a syntax line. Four parts is the height budget: a fifth leaves the bottom of the frame. This is not CodeBlock (a file) and not Terminal (a real run); see the quadrant table in SyntaxSlides.tsx.',
    element: (
      <CodeSyntaxSlide
        lesson={FOOTER}
        kicker="Routing"
        title="Anatomy of a URL pattern"
        language="python"
        parts={[
          { token: 'path', label: 'The URL helper', body: 'Imported from django.urls. One call per route.', after: '(' },
          { token: '"api/products/"', label: 'The pattern', fill: 'placeholder', body: 'What the client asks for. No leading slash, and keep the trailing one.', after: ', ' },
          { token: 'product_list', label: 'The view', fill: 'placeholder', body: 'The function that answers this URL. Passed, never called.', after: ', ' },
          { token: 'name="products"', label: 'The reverse name', body: 'Lets templates and tests name the URL instead of hardcoding it.', after: ')' },
        ]}
      />
    ),
  },
  {
    id: 'command-syntax',
    label: 'Command syntax',
    section: 'DRF',
    notes:
      'THE SHAPE OF A COMMAND. Same figure as the code variant, with a $ prompt instead of a language chip. It deliberately takes no folder path: rule 3 governs Terminal, which shows a command being RUN, and a prompt path here would claim a working directory this slide never demonstrates. Show the actual run in a Terminal on the next slide. Three parts plus a note is the budget.',
    element: (
      <CommandSyntaxSlide
        lesson={FOOTER}
        kicker="Project setup"
        title="Creating an app"
        parts={[
          { token: 'python manage.py', label: 'The task runner', body: 'Every project-level command goes through this file.' },
          { token: 'startapp', label: 'The task', body: 'One of about forty. runserver and migrate are the two you will type most.' },
          { token: 'products', label: 'Your app name', fill: 'placeholder', body: 'Lowercase, plural, no hyphens. It becomes a Python package.', after: '' },
        ]}
        note={{
          kind: 'warning',
          title: 'It is not wired up yet',
          body: 'Creating the app does not install it. Add it to INSTALLED_APPS or Django will never load its models.',
        }}
      />
    ),
  },
  {
    id: 'code-build',
    label: 'Code build',
    section: 'DRF',
    notes:
      'A REAL FILE, ASSEMBLED ONE KEY AT A TIME. Pass the WHOLE file as it stands on this slide, not just the new lines, and list the new ones in highlight: those are the lit ones. The annotation says what the new key does. Across a build sequence give CodeBlock a minHeight equal to its maxHeight, or the panel grows slide by slide and six steps of one file look like six different slides.',
    element: (
      <CodeBuildSlide
        lesson={FOOTER}
        kicker="The view"
        title="Answering GET"
        lead="One decorator, one queryset, one Response."
        code={viewCode}
        filename="products/views.py"
        highlight={[6]}
        annotation={{
          key: '@api_view(["GET"])',
          body: 'Turns a plain Python function into a DRF view, and rejects every verb except GET before your code runs.',
        }}
      />
    ),
  },
  {
    id: 'status-points',
    label: 'Status points (verdicts)',
    section: 'DRF',
    notes:
      'A LIST WHERE EVERY ROW CARRIES A VERDICT. Four kinds: success, info, warning, error. The verdict IS the content, so if every row would come out success this is a ContentSlide and the colour is decoration. Each row states its verdict in a word as well as a colour, so it survives a projector and greyscale. Rows are build steps by default; pass a figure as children and they switch to a staggered entrance, because rule 6 requires text and its visual to arrive together.',
    element: (
      <StatusPointsSlide
        lesson={FOOTER}
        kicker="Reading the outcome"
        title="Four ways a request can end"
        items={[
          { status: 'success', text: '200 OK', code: true, detail: 'The product list is in the body.' },
          { status: 'info', text: '201 Created', code: true, detail: 'A new product exists, and its URL is in the Location header.' },
          { status: 'warning', text: '404 Not Found', code: true, detail: 'The URL is fine, the product is not. This one is not a bug.' },
          { status: 'error', text: '500 Server Error', code: true, detail: 'Your view raised an exception. This one is a bug.' },
        ]}
      />
    ),
  },
  {
    id: 'flow-spine',
    label: 'Flow · SpineFlow',
    section: 'DRF',
    notes:
      'THE DEFAULT FLOW CHART when a process branches. The happy path is an unbroken horizontal line at full weight; the failure drops vertically out of the gate in amber and the loop returns underneath, so it can never be confused with progress. All six of these take the IDENTICAL props, so swapping one for another is a rename. They build one click at a time (Ctrl+arrow), assembling along the path, and the exception only starts once the happy path is complete. Worst at: more than one decision, because there is one row of "below" to drop into.',
    element: (
      <ContentSlide
        lesson={FOOTER}
        kicker="A process with branches"
        title="SpineFlow"
        lead="The happy path is a straight line, and everything else hangs off it."
      >
        <SpineFlow {...FLOW} />
      </ContentSlide>
    ),
  },
  {
    id: 'flow-lane',
    label: 'Flow · LaneFlow',
    section: 'DRF',
    notes:
      'THE SWIMLANE. The only one of the six that answers "whose job is that": a step sits in its owner\'s lane, so handoffs become visible as vertical moves and every crossing is a place the work can stall. It is the only figure that reads the `lane` field. Worst at: a process where every step has the same owner, which is a SpineFlow that has thrown away a third of its height. Needs three lanes to earn its keep.',
    element: (
      <ContentSlide
        lesson={FOOTER}
        kicker="A process with branches"
        title="LaneFlow"
        lead="The same process, but the vertical axis is who owns each step."
      >
        <LaneFlow {...FLOW} />
      </ContentSlide>
    ),
  },
  {
    id: 'flow-ledger',
    label: 'Flow · StepLedger',
    section: 'DRF',
    notes:
      'THE FLOW CHART WITH NO BOXES. STYLE_GUIDE section 8 applied to a process: boxes and arrows draw "discrete units connected by transitions", so if every transition is just "and then", the boxes are decoration. A number in the gutter, a rule per row, the words at full width. Wins on long labels, which every other figure here wraps inside a fixed slot. Worst at: shape. A loop back to step two is a line of text saying so, not a line you can point at.',
    element: (
      <ContentSlide
        lesson={FOOTER}
        kicker="A process with branches"
        title="StepLedger"
        lead="The same process with no boxes, no arrows and no diagram at all."
      >
        <StepLedger {...FLOW} />
      </ContentSlide>
    ),
  },
  {
    id: 'flow-circuit',
    label: 'Flow · CircuitMap',
    section: 'DRF',
    notes:
      'THE TEXTBOOK NOTATION: stadium terminals, rectangles, a real diamond, orthogonal connectors, every exit labelled. Reach for it when the room has met flow charts elsewhere and a house dialect would cost them more than it buys. Worst at: the diamond constrains the copy. Only its middle third is usable, so "All checks pass?" fits and anything longer does not, and the copy is the teaching.',
    element: (
      <ContentSlide
        lesson={FOOTER}
        kicker="A process with branches"
        title="CircuitMap"
        lead="The textbook notation, drawn properly."
      >
        <CircuitMap {...FLOW} />
      </ContentSlide>
    ),
  },
  {
    id: 'flow-gate',
    label: 'Flow · GateFlow',
    section: 'DRF',
    notes:
      'THE DECISION AS A BARRIER WITH PHYSICAL EXTENT. Steps are a card row; the decision is a tall bar standing across the line, with the happy path drawn UNDER it so the line passes through and emerges on the far side. Use it when the check is the point of the slide rather than one step among several. Worst at: a second decision, which has no third vertical level to occupy, and a question past about six words, which starts reading as a title for the whole figure.',
    element: (
      <ContentSlide
        lesson={FOOTER}
        kicker="A process with branches"
        title="GateFlow"
        lead="The decision is not a step. It is a barrier the work has to get past."
      >
        <GateFlow {...FLOW} />
      </ContentSlide>
    ),
  },
  {
    id: 'flow-track',
    label: 'Flow · TrackSwitch',
    section: 'DRF',
    notes:
      'THE ONE WHERE THE LOOP IS THE HERO. A railway: the happy path is one continuous straight rail with stations on it, and at the decision the track switches, peeling away on a curve to a lower return track that merges back on a mirrored curve. Straight line against curved detour is the whole design, and it makes rework feel like a detour that rejoins the journey rather than an arrow pointing backwards. Worst at: it buys one idea with the entire stage, and assumes exactly one loop with room to the right of the gate.',
    element: (
      <ContentSlide
        lesson={FOOTER}
        kicker="A process with branches"
        title="TrackSwitch"
        lead="A railway. The main line runs straight and rework peels off, then merges back."
      >
        <TrackSwitch {...FLOW} />
      </ContentSlide>
    ),
  },
  {
    id: 'boundary-bridge',
    label: 'Boundary bridge (figure)',
    section: 'DRF',
    notes:
      'FOR TWO MACHINES WITH A SHARED THING BETWEEN THEM. Read the constraint before reusing it: the dashed boundaries are labelled "One computer" and "A different computer" IN THE COMPONENT, and the hub carries "On neither machine". Those strings are hardcoded, so this figure ASSERTS a two-machine story with a registry in the middle. It is not a general three-step flow, and pointing it at one makes the slide claim something untrue (rule 8). For a plain process, use FlowChart. Two further rules: every payload arrow runs ALONG the chain, stations[i] to stations[i+1], so nothing points back up it, and `issuedBy` says who TYPED the command, drawn as a subordinate hairline and never as a second arrow. Here push is issued by the laptop (left) and pull by the server (right), and the data still travels left to right in both. Chosen from four candidate designs in slide-kit/flow-lab and promoted to the kit for session 6.',
    element: (
      <ContentSlide
        lesson={FOOTER}
        kicker="Shipping it"
        title="Getting the API onto a server"
        lead="The image is built once, and the server pulls the same one."
      >
        <BoundaryBridge
          stations={[
            { label: 'Your laptop', caption: 'where you built the API', icon: 'code', kind: 'source' },
            { label: 'Docker Hub', caption: 'one copy, addressable by name', icon: 'server', kind: 'hub' },
            { label: 'The server', caption: 'runs what it pulled', icon: 'devices', kind: 'target' },
          ]}
          legs={[
            { label: 'docker push', sub: 'once per release', issuedBy: 'left' },
            { label: 'docker pull', sub: 'on every deploy', issuedBy: 'right' },
          ]}
          caption="The image never travels laptop to server directly. Neither machine has to trust the other."
        />
      </ContentSlide>
    ),
  },
  {
    id: 'fan-out',
    label: 'Fan out (figure)',
    section: 'DRF',
    notes:
      'FOR ONE ARTEFACT AND MANY LIVE COPIES OF IT. The source keeps its single box at full size while every connector leaves it at once, so the room reads MULTIPLICITY rather than sequence, and the source is drawn quiet on purpose (dashed, tinted, no live dot) because the mistake the figure prevents is reading the source as one of the running things. `live` is per copy, so "three containers, one of them stopped" is sayable. It must NOT carry any relationship BETWEEN the copies: they are peers with no connectors between them, so balanced traffic, a shared volume, or copy 2 made from copy 1 are all claims this figure does not make. Confusable with BoundaryBridge, which is two machines and a shared hub between them, and with FlowChart, which is a sequence: reach for FanOut only when one thing becomes several at once. Promoted out of session 1 v2, where it was a deck-local ImageFanout hardcoded to one image and three containers; the contract has no Docker in it.',
    element: (
      <ContentSlide
        lesson={FOOTER}
        kicker="One image, many containers"
        title="Fan out"
        lead="The image is built once. Every container is started from that one copy."
      >
        <FanOut
          source={{ label: 'Image', caption: 'built once, read only', icon: 'folder' }}
          copies={[
            { id: 'c1', label: 'Container 1', note: 'serving traffic', live: true },
            { id: 'c2', label: 'Container 2', note: 'serving traffic', live: true },
            { id: 'c3', label: 'Container 3', note: 'stopped, same image', live: false },
          ]}
          caption="Starting a container never changes the image, which is why the third one is identical to the first."
        />
      </ContentSlide>
    ),
  },
  {
    id: 'three-lanes',
    label: 'Three lanes (figure)',
    section: 'DRF',
    notes:
      'FOR THREE NAMED PRACTICES THAT DIFFER ONLY IN HOW FAR THEY REACH ALONG ONE CHAIN. Built for CI, Continuous Delivery and Continuous Deployment, and the contract carries no CI/CD in it: any set of terms whose relationship is CONTAINMENT along a shared sequence fits, and any set whose relationship is not containment does not. `terms` is INNERMOST FIRST and the array order IS the containment claim, so shuffling it is a content error rather than a layout one. `reaches` is the 1-based stage the automation reaches THROUGH, inclusive, and every span, dim boundary and marker in the figure derives from that one number, so no two parts of the figure can disagree about where a term stops. `approval` draws the human decision at a term\'s own boundary, which is the ONLY thing separating the two CDs in every published definition: span length alone states the difference and hides the why. Tones are ROLES (inner, middle, outer), not hexes, so a caller cannot reach a verdict hue: green, amber and red stay reserved for pass, warn and fail, and the ramp doubles as a luminance ramp so the three survive a greyscale projector. It reveals one lane per click, four beats on one frame, which is what lets one slide replace four definition slides without breaking content rule 25. Chosen from four candidates in slide-kit/cicd-reach-lab because it is the shape Atlassian, Red Hat, AWS, CircleCI, IBM and Bitrise all publish, so the room meets it again in any article they read, and because it is the only candidate that asks no lookup of the viewer. It costs height: 394px against the 425px ceiling, so it takes a slide with no points and a one-line lead. ReachBands is the same convention in 276px and stays in the lab.',
    element: (
      <ContentSlide
        lesson={FOOTER}
        kicker="How far the robot goes"
        title="Three lanes"
        lead="Same chain of stages. The three terms differ only in where the automation stops"
      >
        <ThreeLanes
          stages={[
            { n: 1, label: 'FETCH', caption: 'get the code' },
            { n: 2, label: 'TEST', caption: 'run the tests' },
            { n: 3, label: 'BUILD', caption: 'build the image' },
            { n: 4, label: 'PUSH', caption: 'image to the registry' },
            { n: 5, label: 'DEPLOY', caption: 'run on the server' },
          ]}
          terms={[
            { name: 'Continuous Integration', reaches: 2, then: 'You are told at once if it broke', tone: 'inner' },
            { name: 'Continuous Delivery', reaches: 4, then: 'Ready to go live, and it waits', approval: true, tone: 'middle' },
            { name: 'Continuous Deployment', reaches: 5, then: 'It goes live on its own', tone: 'outer' },
          ]}
        />
      </ContentSlide>
    ),
  },
  {
    id: 'till-row',
    label: 'Till row (figure)',
    section: 'DRF',
    notes:
      'FOR ONE WAITING LINE AND A FIXED NUMBER OF WORKER SLOTS THAT TAKE FROM IT. Built for a Jenkins job, its build queue and its two executors, and the contract carries no Jenkins in it: anything where one trigger creates work, the work WAITS IN ORDER, and a counted set of workers consumes it one at a time fits. `queue` is FRONT OF THE LINE FIRST and that order IS the queue discipline, so shuffling it is a content error rather than a layout one. The number of workers is the `executors` array length and nothing else, and a slot with no `running` is drawn as an EMPTY FRAME the same size as a busy one, never as a dimmed copy: opacity reads as present but unimportant, and only a hole in the picture reads as nothing here. That is what lets a viewer count free slots at a glance, which is the count that explains why the line is or is not moving. THE FAN IS THE POINT: one connector leaves the front of the line, runs along a rail under the desks and rises into EVERY desk with its own arrowhead, because the next ticket is not promised to a particular worker, it goes to whichever frees up first. A single arrow into one desk would teach a wrong queue discipline. It reveals in five beats, six with `done`, in the order the room learns the words: the job, the trigger, the line, both desks together, the fan, the verdict. Busy and free arrive as ONE beat because a contrast cannot be revealed in halves. Chosen from three candidates in slide-kit/queue-lab because it is the only one that draws the mechanism rather than the parts, and it keeps Jenkins own panel titles so the room meets the same picture on the real dashboard. NOT FOR A SEQUENCE: a queue and a worker are not two steps in a row, and drawing them as a chain hides the only fact that matters, that the line exists because there are two slots and not four. Not for a snapshot that has to MOVE either: this draws one instant, and the run stepping from the line into a freed slot is the instructor saying so. Height is a function of the queue length, so it caps at four waiting tickets; five puts the rail past the well. The line is a column and costs 268px of width, which leaves a busy slot room for one short line of note.',
    element: (
      <ContentSlide
        lesson={FOOTER}
        kicker="Where a build waits"
        title="Till row"
        lead="One line of waiting runs, and a fixed number of slots that take from the front of it"
      >
        <TillRow {...QUEUE_FIXTURE} />
      </ContentSlide>
    ),
  },
  {
    id: 'file-tree',
    label: 'File tree (figure)',
    section: 'DRF',
    notes:
      'FOR "WHERE DOES THIS FILE GO". A slide that shows a file\'s CONTENTS never says which folder it belongs in, and "create a file called Dockerfile" is not an instruction until it does. `state` is what makes it teach: `new` is the file this slide asks them to create (brand, tagged once, on the top-level entry only), `existing` is already there from an earlier slide, `later` is named but not created yet (dashed, italic). `open` names the folder that STARTS open, and its children are drawn INSIDE a recessed well that belongs to it rather than as siblings indented by 22px. It is an accordion: every folder row with children is a real button, clicking one shuts whatever was open, there is no all-shut state, and the well reserves the tallest folder\'s height so nothing on the slide moves when the open folder changes. Use it whenever the tree runs past about six rows: session 4 shipped nine flat rows and the review read them as one list rather than as three folders. OMIT `open` and every folder renders expanded with no chevrons, which is what sessions 2 and 3 ship, so the prop is additive. It must NOT be used as a general nested list: the glyphs are a folder and a file, and the header row is a filesystem path, so pointing it at a taxonomy or a menu makes the slide claim something untrue (rule 8).',
    element: (
      <ContentSlide
        lesson={FOOTER}
        kicker="The starting point"
        title="Where the new file goes"
        lead="One folder open at a time, so the room reads three folders rather than one list."
      >
        <FileTree
          root="C:\project"
          open="backend"
          entries={[
            { name: 'backend', folder: true, state: 'existing' },
            { name: 'manage.py', depth: 1, state: 'existing' },
            { name: 'requirements.txt', depth: 1, state: 'existing', note: 'about to change' },
            { name: 'Dockerfile', depth: 1, state: 'new' },
            { name: '.dockerignore', depth: 1, state: 'later' },
            { name: 'frontend', folder: true, state: 'existing' },
            { name: 'package.json', depth: 1, state: 'existing' },
            { name: 'vite.config.js', depth: 1, state: 'existing' },
            { name: 'docker-compose.yml', state: 'later', note: 'the next section' },
          ]}
          caption="backend is open because this slide points at requirements.txt. Shut folders carry a count, not their contents."
        />
      </ContentSlide>
    ),
  },
  {
    id: 'swap-rows',
    label: 'Swap rows (figure)',
    section: 'DRF',
    notes:
      'FOR A COMPARISON WHERE ONE SIDE STANDS IN FOR THE OTHER. A phone\'s speed dial and a Makefile\'s targets; a Python function and a Makefile; a manual ritual and an automated one. Every row is ONE object divided internally, not two boxes with an arrow between them: the familiar side is recessed into it and the new side is raised out of it, so the pairing reads as the sentence "this stands in for that" with no glyph needed. That recessed-to-raised inversion is the argument, and therefore the constraint. It asserts a DIRECTION, so it must NOT be used for two alternatives being weighed against each other, which have none: a DataTable with identical row labels is the figure for that, and drawing peers this way claims something untrue (rule 8). `code` sets both cells of a pairing in monospace, because `make "up"` is a thing you type and reads as the name of an idea when set as prose. There is deliberately no emphasis flag; compareFigure.ts records why it was removed rather than kept and ignored. Chosen in slide-kit/comparison-lab over LedgerCompare, MirrorCards and CallerView, and that lab\'s CLAUDE.md says what each was worse at. Worst at: more than four pairings, because each row is a drawn object rather than a line of text.',
    element: (
      <ContentSlide
        lesson={FOOTER}
        kicker="One stands in for the other"
        title="Swap rows"
        lead="A Makefile does for your commands exactly what a function does for your code."
      >
        <SwapRows
          leftLabel="A Python function"
          rightLabel="A Makefile"
          pairs={[
            { from: 'make_coffee()', to: 'make "up"', code: true },
            { from: 'Body of the function', to: 'docker compose command under the target' },
            { from: 'Caller writes one line', to: 'Anyone running the project types one short word' },
            { from: 'Caller never reads the body', to: 'Nobody needs to know the Docker flags' },
          ]}
          caption="The long thing still exists. It has stopped being anybody's problem."
        />
      </ContentSlide>
    ),
  },
  {
    id: 'architecture',
    label: 'Architecture (only image)',
    section: 'DRF',
    transition: 'fade',
    element: (
      <OnlyImageSlide
        lesson={FOOTER}
        title="The full picture"
        media={{ illustration: 'concept-api' }}
        caption="Client → DRF View → Serializer → Database, and back again"
      />
    ),
  },
  {
    id: 'code-output',
    label: 'Code and its output',
    section: 'Python figures',
    notes:
      'A SNIPPET AND EXACTLY WHAT IT PRINTED. Not CodeBlock (a file), not Terminal (a shell with a folder path), not SyntaxBreakdown (the shape of a construct). `location` is the code panel title and names where the code runs, per rule 31. `output` is pasted from a real run, never composed. Two panes compare; `layout="stack"` gives one wide pane for a long traceback line.',
    element: (
      <ContentSlide lesson={FOOTER} kicker="Python figures" title="Printing the Result">
        <CodeOutput
          panes={[
            { label: 'No quotes', location: 'Code Playground · main.py', code: 'print(2 + 5)', output: '7' },
            { label: 'Quotes', location: 'Code Playground · main.py', code: 'print("2 + 5")', output: '2 + 5' },
          ]}
        />
      </ContentSlide>
    ),
  },
  {
    id: 'logo-wall',
    label: 'Logo wall',
    section: 'Python figures',
    notes:
      'MARKS WITH THEIR NAMES, when the marks ARE the argument: scale ("around 700 languages") or familiarity ("the companies you know run on this"). Every mark carries its name (rule 12), every src must be on disk, and if the marks are not the claim this is decoration filling space (rule 8).',
    element: (
      <ContentSlide lesson={FOOTER} kicker="Python figures" title="Popular Programming Languages" lead="Around ~ 700 Programming Languages">
        <LogoWall
          cols={4}
          marks={[
            { src: '/assets/tech/python.png', name: 'Python' },
            { src: '/assets/tech/django.png', name: 'Django' },
            { src: '/assets/tech/nodejs.png', name: 'Node.js' },
            { src: '/assets/tech/react.png', name: 'React' },
          ]}
        />
      </ContentSlide>
    ),
  },
  {
    id: 'radial-spread',
    label: 'Radial spread',
    section: 'Python figures',
    notes:
      'ONE THING REACHING INTO MANY PLACES. STYLE_GUIDE §8 names this the form for "reach", which a grid of cards cannot draw. Spokes draw one after another on entry (the reach is watched, not shown). Not for a sequence, not for alternatives, and not for fewer than four spokes.',
    element: (
      <ContentSlide lesson={FOOTER} kicker="Python figures" title="Versatile Language" lead="Has applications in almost every field.">
        <RadialSpread
          hub="Python"
          hubLogo="/assets/tech/python.png"
          spokes={[
            { icon: 'bulb', label: 'AI/Machine Learning' },
            { icon: 'database', label: 'Big Data' },
            { icon: 'devices', label: 'Smart Device/IOT' },
            { icon: 'play', label: 'Game Development' },
            { icon: 'server', label: 'Backend Development' },
          ]}
        />
      </ContentSlide>
    ),
  },
  {
    id: 'prompt-card',
    label: 'Prompt card',
    section: 'Python figures',
    notes:
      'TEXT THE LEARNER PASTES INTO AN AI TOOL. Not a file, not a shell, not a callout: the prompt IS the slide. `location` names where it is typed (rule 31 by analogy). [Bracketed] slots render dashed, like a placeholder part in SyntaxBreakdown. `fontSize` is the lever for a long prompt, never maxHeight.',
    element: (
      <ContentSlide lesson={FOOTER} kicker="Python figures" title="Quiz Generation">
        <PromptCard prompt={"I've just completed learning about [concept]. Can you create a comprehensive quiz to test my understanding of this concept?"} />
      </ContentSlide>
    ),
  },
  {
    id: 'value-type-map',
    label: 'Value to type',
    section: 'Python figures',
    notes:
      'VALUES BESIDE THEIR TYPES, when the pairing is the whole claim: 2 is an Integer and "2" is a String. Two or three rows. A fourth row is a DataTable; a value with no partner is a Chip.',
    element: (
      <ContentSlide lesson={FOOTER} kicker="Python figures" title={'2 vs 2.0 vs "2.0"'} lead="Mathematical Value vs Character">
        <ValueTypeMap pairs={[{ value: '2', type: 'Integer' }, { value: '2.0', type: 'Float' }, { value: '"2.0"', type: 'String' }]} />
      </ContentSlide>
    ),
  },
  {
    id: 'variable-trace',
    label: 'Variable trace',
    section: 'Python figures',
    notes:
      'A PROGRAM RUN ONE LINE PER CLICK, variables drawn as boxes (the course\'s container analogy), output appended as it prints. Step 0 is the code alone. Claims exactly steps.length build steps. Every output is pasted from a real run.',
    element: (
      <ContentSlide lesson={FOOTER} kicker="Python figures" title="Variable Assignment">
        <VariableTrace
          code={'a = 1\nprint(a)\na = 2\nprint(a)'}
          steps={[
            { line: 1, boxes: [{ name: 'a', value: '1' }], output: [] },
            { line: 2, boxes: [{ name: 'a', value: '1' }], output: ['1'] },
            { line: 3, boxes: [{ name: 'a', value: '2' }], output: ['1'] },
            { line: 4, boxes: [{ name: 'a', value: '2' }], output: ['1', '2'] },
          ]}
        />
      </ContentSlide>
    ),
  },
  {
    id: 'eval-steps',
    label: 'Evaluation steps',
    section: 'Python figures',
    notes:
      'ONE EXPRESSION REWRITTEN DOWN TO ITS VALUE, one operation per line, the value set apart. For order-of-operations teaching. Not a run (CodeOutput), not a trace (VariableTrace), not a procedure (StepList).',
    element: (
      <ContentSlide lesson={FOOTER} kicker="Python figures" title="Approach - 1">
        <EvalSteps steps={['5 * 2 + 3 * 4', '10 + 12', '22']} />
      </ContentSlide>
    ),
  },
  {
    id: 'quiz-time',
    label: 'Quiz time',
    section: 'Wrap-up',
    transition: 'zoom',
    notes:
      'THE ANNOUNCEMENT FRAME, AND THE ONLY QUIZ FRAME A DECK HAS. It carries no question by design: questions are delivered by an external quiz component, so this hands over to it. QuizSlide was retired for exactly this reason and sync-kit.mjs deletes it from any session that still has it. Rule 18: every deck carries a quiz frame, and a lone one sits immediately before the takeaways. Content rule 28: the frame says "Quiz Time!" and nothing else, so no subtitle is passed here. Because the questions live in the external tool and not on the slide, any subtitle naming what the quiz covers previews the questions and answers some of them. It is also the one frame in the deck with nothing to read, which is what moves the room off the screen and onto the tool. QuizTimeSlideProps still declares an optional subtitle so every delivered session keeps compiling; do not use it.',
    element: <QuizTimeSlide lesson={FOOTER} />,
  },
  {
    id: 'takeaways',
    label: 'Key Takeaways',
    section: 'Wrap-up',
    notes:
      'THE AGENDA CONCEPTS, VERBATIM. Not reworded outcomes, not a fifth item, not a summary written fresh. The room was promised exactly these four things at the start and this frame is the receipt, so the strings must match the agenda character for character. What changes between the two slides is the UI, not the words. Session 5 shipped reworded outcomes here and they were replaced with the agenda strings.',
    element: (
      <KeyTakeawaysSlide
        lesson={FOOTER}
        points={[
          'What is a REST API?',
          'The request and response lifecycle',
          'Django REST Framework',
          'Build an endpoint, step by step',
        ]}
      />
    ),
  },
  {
    id: 'practice',
    label: 'Practice',
    section: 'Wrap-up',
    transition: 'rise',
    element: (
      <PracticeSlide
        lesson={FOOTER}
        title="Your turn to build"
        prompt="Create a read-only endpoint for the Product model."
        tasks={[
          'Write ProductSerializer (ModelSerializer)',
          'Add a product_list view with @api_view(["GET"])',
          'Wire /api/products/ in urls.py',
          'Return all products as JSON with Response',
        ]}
      />
    ),
  },
  {
    id: 'object-state',
    label: 'ObjectState',
    section: 'Figures',
    notes:
      'FOR: one named thing and the values it is holding RIGHT NOW. A build and its settings, a request and its headers, a container and its published ports. `ObjectStateRow` puts two or three of them side by side on one stagger, which is how you say "same class, separate values". MUST NOT CARRY: a definition (the row label is an attribute name, not a term being defined), or a claim (`points/PeerCards` is for claims). CONFUSABLE WITH `DataTable`, and the difference is the whole point: a table says "these rows are data" and has no owner to attach them to, and the owner is the teaching. Set `changed` ONLY on an after card, or you are marking a change the slide has not shown yet.',
    element: (
      <ContentSlide
        kicker="Figures"
        title="ObjectState"
        lead="One object, its attributes, and which of them just moved"
        lesson={FOOTER}
      >
        <ObjectStateRow
          objects={[
            {
              name: 'book1',
              width: 320,
              rows: [
                { name: 'title', value: '"Harry Potter"' },
                { name: 'author', value: '"Rowling"' },
                { name: 'available', value: 'false', changed: true },
              ],
            },
            {
              name: 'book2',
              width: 320,
              rows: [
                { name: 'title', value: '"Atomic Habits"' },
                { name: 'author', value: '"Clear"' },
                { name: 'available', value: 'true' },
              ],
              caption: 'One class, two objects, and only one of them moved',
            },
          ]}
        />
      </ContentSlide>
    ),
  },
  {
    id: 'state-change',
    label: 'StateChange',
    section: 'Figures',
    notes:
      'FOR: the same thing before and after ONE named operation, with the rows that moved marked. Which rows those are is COMPUTED by comparing the two sides, never authored, so the mark cannot contradict the values printed under it. MUST NOT CARRY: two different objects (the name is the same on both sides because it is one thing at two times), or more than one operation. CONFUSABLE WITH `flowchart/SpineFlow`, which also draws a labelled edge between two nodes: use that when the nodes are STEPS, and this when they are one thing at two times.',
    element: (
      <ContentSlide
        kicker="Figures"
        title="StateChange"
        lead="The same object before and after one method ran"
        lesson={FOOTER}
      >
        <StateChange
          before={{
            name: 'account1',
            rows: [
              { name: 'holder', value: '"Ali"' },
              { name: 'balance', value: '50000' },
            ],
          }}
          action="deposit(5000)"
          after={{
            name: 'account1',
            rows: [
              { name: 'holder', value: '"Ali"' },
              { name: 'balance', value: '55000' },
            ],
          }}
          caption="One method ran and one value moved. The holder is exactly as it was"
        />
      </ContentSlide>
    ),
  },
  {
    id: 'code-output',
    label: 'CodeOutput',
    section: 'Figures',
    notes:
      'FOR: this text, run, produces that text. `layout="row"` is the default and the safe one; `stack` gives a single pane the full width for output that is WIDE rather than tall, and it is about 30px taller than the content well allows at five code lines over five output lines, so measure before reaching for it. MUST NOT CARRY: a command the learner types at a shell (that is `Terminal`, with its folder path), the SHAPE of a construct (`CodeSyntaxSlide`), or a file that grows across slides (`CodeBuildSlide`). `output` is what running it actually printed. The one exception is pseudocode, which has no interpreter: there it is the dry run of the code on the same slide and the pane must be labelled "What it prints", never "Output".',
    element: (
      <ContentSlide
        kicker="Figures"
        title="CodeOutput"
        lead="A snippet, and what running it printed"
        lesson={FOOTER}
      >
        <CodeOutput
          panes={[
            {
              label: 'Python',
              language: 'Python',
              code: 'print(6 / 3)\nprint(6 // 3)',
              output: '2.0\n2',
            },
          ]}
        />
      </ContentSlide>
    ),
  },
  {
    id: 'panel-code-trace',
    label: 'CodeBlock: trace features',
    section: 'Panels',
    notes:
      "FOR: the kit's one code box when it teaches: `filename=\"Python\" chip={false}` (content rule 31, the language once), `rows` so a run of consecutive code slides keeps one box height, `lines` for a trace (now, ran, dead, warn, error, mark), `loop` for the loop-back arrow and `labels` for per-line annotations. Every row is pinned to one height only when these are used, so other decks' panels are unchanged. Built for PF 14 \"For Loop\".",
    element: (
      <GallerySlideBase lesson={FOOTER}>
        <GalleryZonedFrame kicker="Panels" title="CodeBlock, traced" lead="One code box, with line states, a loop arrow and labels" mode="top" wide>
          <GalleryCodeBlock
            code={'counter = 0\nwhile counter < 3:\n    print(counter)\n    counter = counter + 1'}
            filename="Python"
            chip={false}
            fontSize={20}
            rows={4}
            loop={[2, 4]}
            lines={{ 1: 'ran', 2: 'now', 3: 'dead' }}
            labels={{ 1: 'Initialization', 2: 'Termination condition', 4: 'Updation' }}
            className="w-[560px]"
          />
        </GalleryZonedFrame>
      </GallerySlideBase>
    ),
  },
  {
    id: 'panel-output',
    label: 'OutputPanel',
    section: 'Panels',
    notes:
      'FOR: an output (or input) on its own, with no snippet beside it: `kind="input"` for what went in, `title="Expected output"` for the one honest case where the program on the slide does NOT print it. `height` fixes a panel a trace fills line by line; `lineHeight` tightens one sized for its longest run; `after` draws a row inside it ("the row you wanted"). MUST NOT CARRY: anything not printed by the program, except under the Expected output title.',
    element: (
      <GallerySlideBase lesson={FOOTER}>
        <GalleryZonedFrame kicker="Panels" title="OutputPanel" lead="Input, output, expected output" mode="top" wide>
          <GalleryRow>
            <div className="w-[220px]"><GalleryOutputPanel kind="input" output="Python" fontSize={22} /></div>
            <div className="w-[220px]"><GalleryOutputPanel title="Expected output" output={'P\ny\nt'} fontSize={22} /></div>
            <div className="w-[220px]"><GalleryOutputPanel output={'0\n1\n2'} fontSize={22} /></div>
          </GalleryRow>
        </GalleryZonedFrame>
      </GallerySlideBase>
    ),
  },
  {
    id: 'panel-pseudo-shape',
    label: 'PseudoShape',
    section: 'Panels',
    notes:
      "FOR: the SHAPE of a loop header and the block it repeats, in the kit's dark pseudocode palette, beside real code. The block is a dashed placeholder because it is \"whatever goes here\". MUST NOT CARRY: real code (that is `CodeBlock`). Confusable with `CodeSyntaxSlide`, which names each slot; this draws the repetition.",
    element: (
      <GallerySlideBase lesson={FOOTER}>
        <GalleryZonedFrame kicker="Panels" title="PseudoShape" mode="top" wide>
          <GalleryPseudoShape
            head={[{ t: 'for', k: 'control' }, { t: ' each_item ' }, { t: 'in', k: 'control' }, { t: ' sequence', k: 'ident' }, { t: ':' }]}
            block="Repeating block of code"
          />
        </GalleryZonedFrame>
      </GallerySlideBase>
    ),
  },
  {
    id: 'panel-range-figures',
    label: 'RangeCall, RangeCells, CrossList',
    section: 'Panels',
    notes:
      'FOR: `RangeCall` a call drawn big with what each argument means pointed at; `RangeCells` a call and the values it gives as cells; `CrossList` the things a new form makes unnecessary. Static: they arrive with the slide.',
    element: (
      <GallerySlideBase lesson={FOOTER}>
        <GalleryZonedFrame kicker="Panels" title="Range figures" mode="top" wide>
          <GalleryRow gap={56} align="center">
            <GalleryRangeCall call={<>range(<GalleryRangeArg>n</GalleryRangeArg>)</>} below="Stops before n" />
            <GalleryRangeCells call="range(3)" values={[0, 1, 2]} />
            <GalleryCrossList heading="Not needed any more:" items={['Initialization', 'Updation']} />
          </GalleryRow>
        </GalleryZonedFrame>
      </GallerySlideBase>
    ),
  },
  {
    id: 'panel-countdown',
    label: 'Countdown',
    section: 'Panels',
    notes:
      'FOR: a timed hands-on task. The instructor presses play; nothing starts by itself; press again to pause; it warns amber in its last quarter and goes red at zero. Leaving the slide resets it.',
    element: (
      <GallerySlideBase lesson={FOOTER}>
        <GalleryZonedFrame kicker="Panels" title="Countdown" mode="top" wide>
          <GalleryCountdown seconds={90} />
        </GalleryZonedFrame>
      </GallerySlideBase>
    ),
  },
  {
    id: 'panel-match-pairs',
    label: 'MatchPairs',
    section: 'Panels',
    notes:
      "FOR: parts on the left, jobs on the right, joined one pair per build step with its explanation line. The right column must NOT be in the left column's order. Opens with nothing joined. Next is labelled Join them.",
    element: (
      <GallerySlideBase lesson={FOOTER}>
        <GalleryZonedFrame kicker="Panels" title="MatchPairs" mode="top" wide>
          <GalleryMatchPairs
            left={[{ pair: 1, text: 'x = 0' }, { pair: 2, text: 'x = x + 1' }]}
            right={[{ pair: 2, text: 'Moves it on' }, { pair: 1, text: 'Sets the start' }]}
            notes={['The start.', 'The step.']}
          />
        </GalleryZonedFrame>
      </GallerySlideBase>
    ),
  },
  {
    id: 'panel-beat-story',
    label: 'BeatStory',
    section: 'Panels',
    notes:
      'FOR: a story told in beats beside a figure that changes with them (`figure(beat)`). Every line is on screen from the first beat, ghosted; only the current one carries its sentence. The last line is the question handed to the room.',
    element: (
      <GallerySlideBase lesson={FOOTER}>
        <GalleryZonedFrame kicker="Panels" title="BeatStory" mode="top" wide>
          <GalleryBeatStory
            figureWidth={236}
            figure={(beat) => <GalleryStoryArt name="playlist-phone" beat={beat} className="h-[410px] w-[236px]" />}
            lines={[{ title: 'The list', text: 'A playlist.' }, { title: 'One tap', text: 'Song one starts.' }, { title: 'Your turn', text: 'Where else?' }]}
          />
        </GalleryZonedFrame>
      </GallerySlideBase>
    ),
  },
  {
    id: 'panel-examples-shape',
    label: 'ExamplesToShape',
    section: 'Panels',
    notes:
      'FOR: four beats: the question with three empty "yours" boxes, our three examples, the shared shape, its closing line. The three boxes share one text size. Art is `StoryArt`.',
    element: (
      <GallerySlideBase lesson={FOOTER}>
        <GalleryZonedFrame kicker="Panels" title="ExamplesToShape" mode="top" wide>
          <GalleryExamplesToShape
            ask={{ title: 'Where else?', text: 'One action, and it keeps going.' }}
            examples={[
              { art: 'attendance-register', title: 'A register', text: 'One name, one tick.' },
              { art: 'stories-phone', title: 'Stories', text: 'One story, then the next.' },
              { art: 'billing-scanner', title: 'A counter', text: 'One item, one beep.' },
            ]}
            shape="loop-shape"
            caption="Same shape all three times."
          />
        </GalleryZonedFrame>
      </GallerySlideBase>
    ),
  },
  {
    id: 'panel-string-walker',
    label: 'StringWalker',
    section: 'Panels',
    notes:
      "FOR: the for loop over a string, played with rather than presented: pick a word, Split it, then Play or One step. Steps are computed from the word. Local state: the deck's arrows still change slide. Output panel is sized for seven lines.",
    element: (
      <GallerySlideBase lesson={FOOTER}>
        <GalleryZonedFrame kicker="Panels" title="StringWalker" mode="top" wide>
          <GalleryStringWalker rows={4} />
        </GalleryZonedFrame>
      </GallerySlideBase>
    ),
  },
  {
    id: 'panel-trace',
    label: 'TracePanel',
    section: 'Panels',
    notes:
      "FOR: a program on the left, its state on the right, one beat per statement it runs, one caption under both. `aside` is composed per beat from `VarTrail`, `SeqBoxes`, `DayTrack`, `CallChip`, `OutputPanel`. The code box is the deck's one code box (x 64, y 221, 560 wide).",
    element: (
      <GallerySlideBase lesson={FOOTER}>
        <GalleryZonedFrame kicker="Panels" title="TracePanel" mode="top" wide>
          <GalleryTracePanel
            code={'n = 0\nn = n + 1\nprint(n)'}
            rows={3}
            beats={[
              { caption: 'n starts at 0.', lines: { 1: 'now' }, aside: <GalleryVarTrail name="n" values={['0']} /> },
              { caption: 'n goes to 1.', lines: { 1: 'ran', 2: 'now' }, aside: <GalleryVarTrail name="n" values={['0', '1']} /> },
              { caption: 'It prints 1.', lines: { 1: 'ran', 2: 'ran', 3: 'now' }, aside: <GalleryOutputPanel output="1" fontSize={18} height={96} /> },
            ]}
          />
        </GalleryZonedFrame>
      </GallerySlideBase>
    ),
  },
  {
    id: 'panel-range-dial',
    label: 'RangeDial',
    section: 'Panels',
    notes:
      'FOR: range played with: start and stop steppers, the 0 to 10 cells, Show the numbers, and the sentence that counts them. The stop cell is always drawn crossed. Changing a number hides the answer again.',
    element: (
      <GallerySlideBase lesson={FOOTER}>
        <GalleryZonedFrame kicker="Panels" title="RangeDial" mode="top" wide>
          <GalleryRangeDial caption="Say the two numbers first." />
        </GalleryZonedFrame>
      </GallerySlideBase>
    ),
  },
  {
    id: 'panel-savings-story',
    label: 'SavingsStory',
    section: 'Panels',
    notes:
      'FOR: a rule applied day by day until adding by hand stops being reasonable: day tiles, the girl and the pig (`StoryArt`), who speaks, the running total, coins dropping. Sets up a coding challenge.',
    element: (
      <GallerySlideBase lesson={FOOTER}>
        <GalleryZonedFrame kicker="Panels" title="SavingsStory" mode="top" wide>
          <GallerySavingsStory
            name="Riya"
            days={[{ label: 'Day 1', coin: '₹1', at: 2 }, { label: 'Day 2', skip: 'skip', at: 3 }]}
            beats={[
              { who: 'girl', says: 'I will save on odd days.', total: '₹0', caption: 'The rule.' },
              { who: 'girl', says: 'Day 1: ₹1.', total: '₹1', drops: [0], caption: 'The rule.' },
              { who: 'pig', says: 'Day 2: nothing!', total: '₹1', pigSad: true, caption: 'The rule.' },
            ]}
          />
        </GalleryZonedFrame>
      </GallerySlideBase>
    ),
  },
  {
    id: 'panel-challenge',
    label: 'ChallengePanel',
    section: 'Panels',
    notes:
      'FOR: a problem card with compact input/output examples, how to attempt it, a timer, and a hint that arrives on the second beat.',
    element: (
      <GallerySlideBase lesson={FOOTER}>
        <GalleryZonedFrame kicker="Panels" title="ChallengePanel" mode="top" wide>
          <GalleryChallengePanel
            title="A challenge"
            statement={['Read n. Print n doubled.']}
            examples={[{ input: '2', output: '4' }]}
            lead="Open the playground."
            steps={['Run it with 2.']}
            seconds={120}
            hint="Multiply by 2."
          />
        </GalleryZonedFrame>
      </GallerySlideBase>
    ),
  },
  {
    id: 'panel-run-compare',
    label: 'RunCompare',
    section: 'Panels',
    notes:
      "FOR: two programs a few characters apart, voted on, then run on the same n. Each side's `rows(n)` MUST be the program's real output. The missing row is drawn dashed inside the wrong side's output. Output panels are sized for the largest n.",
    element: (
      <GallerySlideBase lesson={FOOTER}>
        <GalleryZonedFrame kicker="Panels" title="RunCompare" mode="top" wide>
          <GalleryRunCompare
            sides={[
              { mark: 'A', heading: 'range(1, n)', code: 'for i in range(1, n):\n    print(i)', rows: (n) => Array.from({ length: n - 1 }, (_, i) => String(i + 1)), wrong: true },
              { mark: 'B', heading: 'range(1, n + 1)', code: 'for i in range(1, n + 1):\n    print(i)', rows: (n) => Array.from({ length: n }, (_, i) => String(i + 1)) },
            ]}
            hint="Vote, then run."
            verdict="B prints n."
            caption="Hands up for A, then B."
          />
        </GalleryZonedFrame>
      </GallerySlideBase>
    ),
  },
  {
    id: 'panel-takeaway-tree',
    label: 'TakeawayTree',
    section: 'Panels',
    notes:
      'FOR: seven takeaways where the later ones follow from the first: a root, two pairs, a chain, one node per beat with its lines. MUST NOT CARRY: an agenda restatement (that is `KeyTakeawaysSlide`, content rule 20).',
    element: (
      <GallerySlideBase lesson={FOOTER}>
        <GalleryZonedFrame kicker="Panels" title="TakeawayTree" mode="top" wide>
          <GalleryTakeawayTree
            nodes={[
              { chip: 'root', text: 'the one idea' },
              { chip: 'a', text: 'follows from it' },
              { chip: 'b', text: 'so does this' },
              { chip: 'c', text: 'from a' },
              { chip: 'd', text: 'from b' },
              { chip: 'e', text: 'from both' },
              { chip: 'f', text: 'the consequence' },
            ]}
          />
        </GalleryZonedFrame>
      </GallerySlideBase>
    ),
  },
  {
    id: 'next-session',
    label: 'Next session',
    section: 'Wrap-up',
    notes:
      'THE SIGNPOST BEFORE THE CLOSE. A glass chip reading "Next Session" over the next session\'s name, on the mesh ground, the two centred together as one block. The name is written the way that session\'s own title slide will write it, and nothing else goes on the frame: no line on why it follows, no list of what it covers. It sits after the takeaways and before the feedback frame (content rule 41: feedback is followed only by the close), which is why Thank you carries no "next up" line of its own.',
    element: <NextSessionSlide title="Lists and Strings" lesson={FOOTER} />,
  },
  {
    id: 'feedback',
    label: 'Feedback',
    section: 'Wrap-up',
    element: (
      <FeedbackSlide lesson={FOOTER} />
    ),
  },
  {
    id: 'thank-you',
    label: 'Thank you',
    transition: 'zoom',
    notes:
      'TWO WORDS, THE WHITE MARK, AND NOTHING ELSE. No sign-off sentence, no recap of what the room can now do, and no "see you next session": the Next session frame sits immediately before this one and already names what is coming, and a summary here gives the deck two endings. `message` still exists on the props type for a deck that genuinely needs one line, but the default is nothing. The send-off, All the Best, follows it on the same frame.',
    element: (
      <ThankYouSlide title="Thank You" />
    ),
  },
  {
    id: 'all-the-best',
    label: 'All the best',
    transition: 'fade',
    notes:
      'THE SEND-OFF, AND THE LAST FRAME. The same frame as Thank you with different words: `ThankYouSlide title="All the Best"`. Title case under the kicker and title rule, so "the" stays lowercase. Nothing else goes on it.',
    element: <ThankYouSlide title="All the Best" />,
  },
]
