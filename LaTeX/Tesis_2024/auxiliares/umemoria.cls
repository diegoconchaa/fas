%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%%%%%%%
%%%%%%%%	Seminario de Titulación
%%%%%%%%	Editor: David Vielma
%%%%%%%%	Version: 1.3
%%%%%%%%	Fecha: 04-04-2024
%%%%%%%%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
\NeedsTeXFormat{LaTeX2e}[2009/09/24]
\ProvidesClass{auxiliares/umemoria}[2024/04/09 v1.3 Plantilla Tesis USACH Ingenieria Civil Mecacnica]

%% Definicion de Condicionales
\newif\if@swapnum
\newif\if@contnum
\newif\if@en
\@swapnumfalse
\@contnumtrue
\@enfalse

%% Declaracion de Opciones
\DeclareOption{leftnum}{\@swapnumtrue}
\DeclareOption{rightnum}{\@swapnumfalse}
\DeclareOption{contnum}{\@contnumtrue}
\DeclareOption{english}{\@entrue}
\DeclareOption{nocontnum}{\@contnumfalse}
\DeclareOption{uprightd}{\AtEndOfPackage{\DeclareMathSymbol{d}{\mathalpha}{operators}{`d}}}
\DeclareOption{uprighte}{\AtEndOfPackage{\DeclareMathSymbol{e}{\mathalpha}{operators}{`e}}}
\DeclareOption{uprighti}{\AtEndOfPackage{\DeclareMathSymbol{i}{\mathalpha}{operators}{`i}}}
\DeclareOption{upright}{\ExecuteOptions{uprightd,uprighte,uprighti}}

%% Pasar Opciones a clase Book
\DeclareOption*{\PassOptionsToClass{\CurrentOption}{book}}
\ProcessOptions\relax
\LoadClass[10pt,letterpaper,oneside]{book}

% Tipo de letra
\RequirePackage[scaled]{helvet}
\renewcommand{\familydefault}{\sfdefault}
\usepackage[T1]{fontenc}
\renewcommand{\rmdefault}{phv}
\renewcommand{\sfdefault}{phv}

%% Packages necesarios
\RequirePackage[utf8]{inputenc} %Encoding
\RequirePackage[top=2.5cm, left=4cm, bottom=2.5cm, right=2.5cm, paper=letterpaper]{geometry} % Margenes % si se agrega la opcion ''showframe'', se muestran los margenes
\RequirePackage{amsmath, amssymb, amsthm, graphicx, float, nccmath} % Varios

%% Caption antes de la tabla
\RequirePackage{caption}
\captionsetup[table]{position=above}

% %% Agregar palabra para anexos
\RequirePackage{appendix} %apéndices

%%Configuración del Lenguaje
\if@en
	\RequirePackage{babel}
\else
	\RequirePackage[spanish, es-nolists, es-lcroman]{babel} % Lenguaje
\fi
% Links y numeracion del PDF
\RequirePackage{listings} % Codigo Fuente
\RequirePackage{pgffor} % foreach
% In the .cls file (somewhere after \LoadClass or \NeedsTeXFormat)

%% Lenguaje
\addto\captionsspanish{\renewcommand\tablename{Tabla}}

\addto\captionsspanish{\renewcommand\contentsname{Tabla de Contenido}}


\addto\captionsspanish{\renewcommand\listtablename{Índice de Tablas}}
\addto\captionsspanish{\renewcommand\listfigurename{Índice de Figuras}}

%% Interlineado
\setlength{\parskip}{1.5ex} %interlineado de 1.5

%% Renovar enumerate e itemize
\let\oldenum\enumerate
\let\oldendenum\endenumerate
\renewenvironment{enumerate}{\oldenum\setlength{\parskip}{\smallskipamount}}{\oldendenum}
\let\olditem\itemize
\let\oldenditem\enditemize
\renewenvironment{itemize}{\olditem\setlength{\parskip}{\smallskipamount}}{\oldenditem}

%% Entornos nuevos
%%% ABASTRACT %%%
\newenvironment{abstract}{%
\chapter*{Abstract}
}{\vfill\null}
%%% RESUMEN %%%
\newenvironment{resumen}{%
\chapter*{Resumen}
\addcontentsline{toc}{chapter}{Resumen}
}{\vfill\null}
%%% DERECHOS DE AUTOR %%%
\newenvironment{derechoautor}{%
\vspace*{21cm}
\vfill
\centering
\thispagestyle{empty}
\setcounter{page}{0}
}{\vfill\null}
%%% DEDICATORIA %%%
\newenvironment{dedicatoria}
{\null\vspace{\stretch{1}}\begin{flushright}\itshape\chapter*{Dedicatoria}\addcontentsline{toc}{chapter}{Dedicatoria}}
{\end{flushright}\vspace{\stretch{2}}\null}
\let\thanks\undefined
%%% AGRADECIMIENTOS %%%
\newenvironment{thanks}{
	\cleardoublepage
	\if@en
		\chapter*{Acknowledgments}
	\else
		\chapter*{Agradecimientos}
            \addcontentsline{toc}{chapter}{Agradecimientos}
	\fi
	
}{\vfill\null}

%% Teoremas, proofs, etc
\renewenvironment{proof}[1][\proofname] {\par\pushQED{\qed}\normalfont\topsep6\p@\@plus6\p@\relax\trivlist\item[\hskip\labelsep\scshape\footnotesize#1\@addpunct{.}]\ignorespaces}{\popQED\endtrivlist\@endpefalse}

\newtheoremstyle{miestilo}{\baselineskip}{3pt}{\itshape}{}{\bfseries}{}{.5em}{}
\newtheoremstyle{miobs}{\baselineskip}{3pt}{}{}{\bfseries}{}{.5em}{}
\if@swapnum
	\swapnumbers
\fi
\theoremstyle{miestilo}
\newtheorem{defn}{Definición}[chapter]
\if@contnum
	\if@en
		\newtheorem{teo}[defn]{Theorem}
		\newtheorem{cor}[defn]{Corollary}
		\newtheorem{lema}[defn]{Lemma}
		\newtheorem{prop}[defn]{Proposition}
	\else
		\newtheorem{teo}[defn]{Teorema}
		\newtheorem{cor}[defn]{Corolario}
		\newtheorem{lema}[defn]{Lema}
		\newtheorem{prop}[defn]{Proposición}
	\fi
\else
	\if@en
		\newtheorem{teo}{Theorem}[chapter]
		\newtheorem{cor}{Corollary}[chapter]
		\newtheorem{lema}{Lemma}[chapter]
		\newtheorem{prop}{Proposition}[chapter]
	\else
		\newtheorem{teo}{Teorema}[chapter]
		\newtheorem{cor}{Corolario}[chapter]
		\newtheorem{lema}{Lema}[chapter]
		\newtheorem{prop}{Proposición}[chapter]
	\fi
\fi
\theoremstyle{miobs}

\if@en
	\newtheorem*{ej}{Example}
	\newtheorem*{obs}{Observation}
\else
	\newtheorem*{ej}{Ejemplo}
	\newtheorem*{obs}{Observación}
\fi

%% Comandos para la portada
\global\def\@universidad{\MakeUppercase{Universidad de Santiago de Chile}}
\newcommand{\setuniversidad}[1]{\def\@carrera{#1}}
\let\universidad\setuniversidad
\let\setuniversidad\relax

\global\def\@facultad{\MakeUppercase{Facultad de Ingeniería}}
\newcommand{\setfacultad}[1]{\def\@carrera{#1}}
\let\facultad\setfacultad
\let\setfacultad\relax

\global\def\@lugar{\textbf{Santiago - Chile}}
\newcommand{\setlugar}[1]{\def\@lugar{#1}}
\let\lugar\setlugar
\let\setlugar\relax

\global\let\@carrera\@empty
\newcommand{\setcarrera}[1]{\def\@carrera{#1}}
\let\carrera\setcarrera
\let\setcarrera\relax

\global\let\@grado\@empty
\newcommand{\setgrado}[1]{\def\@grado{#1}}
\let\grado\setgrado
\let\setgrado\relax

\global\let\@tesis\@empty
\newcommand{\settesis}[1]{\def\@tesis{#1}}
\let\tesis\settesis
\let\settesis\relax

\global\let\@titulopdf\@empty
\newcommand{\settitulopdf}[1]{\def\@titulopdf{#1}}
\let\titulopdf\settitulopdf
\let\settitulopdf\relax

\global\let\@guia\@empty
\newcommand{\setguia}[1]{\def\@guia{#1}}
\let\guia\setguia
\let\setguia\relax

\global\let\@coguia\@empty
\newcommand{\setcoguia}[1]{\def\@coguia{#1}}
\let\coguia\setcoguia
\let\setcoguia\relax

\global\let\@depto\@empty
\newcommand{\setdepto}[1]{\def\@depto{#1}}
\let\depto\setdepto
\let\setdepto\relax

\global\let\@auspicio\@empty
\newcommand{\setauspicio}[1]{\def\@auspicio{#1}}
\let\auspicio\setauspicio
\let\setauspicio\relax

\global\let\@anho\@empty
\newcommand{\setanho}[1]{\def\@anho{#1}}
\let\anho\setanho
\let\setanho\relax

\global\let\@comisiona\@empty
\newcommand{\setcomisiona}[1]{\def\@comisiona{#1}}
\let\comisiona\setcomisiona
\let\setcomisiona\relax

\global\let\@comisionb\@empty
\newcommand{\setcomisionb}[1]{\def\@comisionb{#1}}
\let\comisionb\setcomisionb
\let\setcomisionb\relax

\global\let\@bajadatitulo\@empty
\newcommand{\setbajadatitulo}[1]{\def\@bajadatitulo{#1}}
\let\bajadatitulo\setbajadatitulo
\let\setbajadatitulo\relax

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%Portada
\renewcommand{\maketitle}{
	\begin{titlepage}
    \vspace*{0.35cm}
        \begin{flushright}
                \begin{tabular}{cl}
                    \vspace{4ex}& \multirow{4}{*}{\vspace{0cm}\includegraphics[width=3cm]{auxiliares/logo_usach.png}} \\
                    \textbf{\Large \@universidad}\vspace{1.5ex} &  \\
                    \textbf{\large \@facultad}\vspace{1.5ex} &\\
                    \textbf{\large \@depto}\vspace{1.5ex} & \\
                \end{tabular}
        \end{flushright}
    \vspace*{2.5cm}
    \begin{center}
        \large\textbf{\@title}
    \end{center}
    \begin{center}
        \large\textbf{\@bajadatitulo}
    \end{center}
    \vspace*{1cm} % \vspace*{1.25cm} cuando no esta la palabra avance
    \begin{center}
        \textbf{\@author}
    \end{center}
    \vspace*{1.5cm}

    \setlength{\extrarowheight}{10pt}
    \begin{table}[h!]
    \centering
    \begin{tabular}{p{7cm}p{7cm}}
     & \textbf{Profesor Guía:}                             \\
     & \textbf{\@guia}                                     \\
     & \textbf{Tesis para optar al título de \@tesis}
    \end{tabular}
    \end{table}

    \vfill

    % quitar miembros comision para biblioteca, ajustar siguiente espacio en 2.5cm
    % en caso contrario espacio a 1.5cm
    
    \begin{center}
	   \@lugar \vspace{1.5ex}\par \textbf{\MakeUppercase\@anho}
    \end{center}
	\end{titlepage}
	
	%% Configuración de hyperref
	%%  (... tenemos en título, autor, etc., acá)
	\hypersetup{
		pdfauthor = {\@author},
		pdftitle = {\@titulopdf}
	}
}
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%Estilo del frontmatter
\newcommand{\ps@front}{
  \renewcommand{\thepage}{\hfill\roman{page}}
  \renewcommand{\@oddhead}{}
  \renewcommand{\@evenhead}{}
  \renewcommand{\@oddfoot}{\hfill\thepage}
  \renewcommand{\@evenfoot}{\hfill\thepage}
}

\let\oldfrontmatter\frontmatter
\renewcommand{\frontmatter}{
	\pagestyle{front}
	\oldfrontmatter
}
\let\oldfrontmatter\relax


% Quita la palabra capitulo y lo reemplaza por el numero correspondiente y el encabezado 
\RequirePackage{titlesec}
\titleformat{\chapter}[hang]{\bf\huge}{\thechapter.}{2pc}{}

% Paquetes Extras
\RequirePackage{multirow,setspace,lipsum,csquotes,textcomp, gensymb,multicol,graphicx,array}


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% Cita en APA
%\RequirePackage[backend=biber,bibstyle=apa,citestyle=apa,sortcites=true,sorting=none,natbib=true]{biblatex}
%\DeclareLanguageMapping{spanish}{spanish-apa}
% de aqui se descarga el APA actualizado https://github.com/plk/biblatex-apa/tree/master/tex/latex/biblatex-apa

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%Cita en ISO 690
\RequirePackage[backend=biber,
style=iso-numeric,
autocite=plain,
maxbibnames=3,
maxcitenames=1,
urldate=long,
uniquelist=false,
datamodel=datamodelFile
]{biblatex}

%##### Elimina DOI e ISBN de todas las entradas#####
% \AtEveryBibitem{
%     \clearfield{isbn}%
%     \clearfield{doi}%  
% }

%##### Bold Authors ######
\DeclareNameFormat{given-family-bold}{{%\mkbibbold
  \ifgiveninits
    {\usebibmacro{name:family-given}
      {\namepartfamily}
      {\namepartgiveni}
      {\namepartprefix}
      {\namepartsuffix}}
    {\usebibmacro{name:family-given}
      {\namepartfamily}
      {\namepartgiven}
      {\namepartprefix}
      {\namepartsuffix}}%
  \usebibmacro{name:andothers}}}
\DeclareNameAlias{author}{given-family-bold}

%##### Reemplaza "y col." por "et al." para cita "authoryear"######
\DefineBibliographyStrings{spanish}{andothers={et al\adddot}}
\renewcommand{\multinamedelim}{,\space}

%##### Reemplaza "online" por  "En línea" para entradas con urldate ######
\newcommand*\myonlinetranslation{En línea}
\DeclareFieldFormat[online]{howpublished}{%
  \iffieldundef{howpublished}
    {\mkbibbrackets{\myonlinetranslation}}
    {\mkbibbrackets{#1}}%
}
\renewbibmacro*{medium-type}{%
  \iffieldundef{howpublished}
    {\iffieldundef{urlyear}
      {}
      {\printtext{\mkbibbrackets{\myonlinetranslation}}}}
    {\printfield{howpublished}}%
}

%##### Reemplaza strings asociados a URL ######
\DefineBibliographyStrings{spanish}{%
    urlseen = {Consultado el:},
    url = {Disponible en:}
}

\DeclareFieldFormat{url}{\bibstring{url}\space\url{#1}}

\addbibresource{library.bib}


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

% nivel de enumeracion
\setcounter{secnumdepth}{4}
\setcounter{tocdepth}{4}

\newcommand{\source}[1]{\caption*{\small Fuente: {#1}}}
\newcommand{\sourcetab}[1]{\caption*{\raggedright\small Fuente: {#1}}}

\RequirePackage{makecell, cellspace, booktabs, threeparttable, enumerate}
\setlength\cellspacetoplimit{3pt}
\setlength\cellspacebottomlimit{3pt}

% dimension soportada de matrices
\setcounter{MaxMatrixCols}{20}

% Paqueta para colores table
\RequirePackage[table,xcdraw]{xcolor}

%Para más secciones usar \paragraph{...}
\titleformat{\paragraph}
{\normalfont\normalsize\bfseries}{\theparagraph}{1em}{}
\titlespacing*{\paragraph}
{0pt}{3.25ex plus 1ex minus .2ex}{1.5ex plus .2ex}

% Notas en tablas
\RequirePackage{tablefootnote}

%  Debe ir al final para que las notas a pie de pagina funcionen bien
\RequirePackage[pdfpagelabels,hidelinks]{hyperref}

\usepackage{setspace}

\RequirePackage{fancyhdr}
\pagestyle{fancy}
\fancyhf{}
\fancyfoot[R]{\thepage}
\renewcommand{\headrulewidth}{0pt}

\fancypagestyle{plain}{
  \fancyhf{}
  \fancyfoot[C]{\thepage}
  \renewcommand{\headrulewidth}{0pt}
}

\renewcommand{\frontmatter}{
  \pagenumbering{roman}
  \pagestyle{front}
  \fancypagestyle{plain}{  % redefine plain to be centered
    \fancyhf{}
    \fancyfoot[R]{\thepage}
    \renewcommand{\headrulewidth}{0pt}
  }
  \oldfrontmatter
}

\renewcommand{\mainmatter}{
  \pagenumbering{arabic}
  \pagestyle{fancy}
  \fancypagestyle{plain}{  % redefine plain to match fancy
    \fancyhf{}
    \fancyfoot[R]{\thepage}
    \renewcommand{\headrulewidth}{0pt}
  }
}

\usepackage{tocloft}
\renewcommand{\cftfigpresnum}{Figura~}
\renewcommand{\cfttabpresnum}{Tabla~}
%\renewcommand{\cftfigaftersnum}{. }
%\renewcommand{\cfttabaftersnum}{. }

\setlength{\cftfignumwidth}{6em}
\setlength{\cfttabnumwidth}{5em}