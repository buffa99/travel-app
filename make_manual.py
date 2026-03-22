"""ToDoトラベル 使用マニュアル PDF生成スクリプト"""

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY

# ===== 日本語フォント登録 =====
pdfmetrics.registerFont(TTFont('JP',      'C:/Windows/Fonts/meiryo.ttc',   subfontIndex=0))
pdfmetrics.registerFont(TTFont('JP-Bold', 'C:/Windows/Fonts/meiryob.ttc',  subfontIndex=0))

# ===== カラー定義 =====
PRIMARY    = colors.HexColor('#1976D2')
PRIMARY_LT = colors.HexColor('#E3F2FD')
ACCENT     = colors.HexColor('#F57C00')
DARK       = colors.HexColor('#212121')
GRAY       = colors.HexColor('#757575')
LIGHT_GRAY = colors.HexColor('#F5F5F5')
WHITE      = colors.white

# ===== スタイル =====
def make_styles():
    s = {}

    s['cover_title'] = ParagraphStyle('cover_title',
        fontName='JP-Bold', fontSize=32, textColor=WHITE,
        alignment=TA_CENTER, spaceAfter=8)

    s['cover_sub'] = ParagraphStyle('cover_sub',
        fontName='JP', fontSize=14, textColor=colors.HexColor('#BBDEFB'),
        alignment=TA_CENTER, spaceAfter=4)

    s['cover_version'] = ParagraphStyle('cover_version',
        fontName='JP', fontSize=10, textColor=colors.HexColor('#90CAF9'),
        alignment=TA_CENTER)

    s['section'] = ParagraphStyle('section',
        fontName='JP-Bold', fontSize=16, textColor=PRIMARY,
        spaceBefore=18, spaceAfter=8, borderPad=4)

    s['subsection'] = ParagraphStyle('subsection',
        fontName='JP-Bold', fontSize=12, textColor=DARK,
        spaceBefore=12, spaceAfter=4,
        leftIndent=4, borderLeftWidth=3,
        borderLeftColor=ACCENT, borderLeftPadding=6)

    s['body'] = ParagraphStyle('body',
        fontName='JP', fontSize=10, textColor=DARK,
        leading=18, spaceAfter=6, alignment=TA_JUSTIFY)

    s['body_b'] = ParagraphStyle('body_b',
        fontName='JP-Bold', fontSize=10, textColor=DARK,
        leading=18, spaceAfter=4)

    s['step'] = ParagraphStyle('step',
        fontName='JP', fontSize=10, textColor=DARK,
        leading=18, spaceAfter=4, leftIndent=16, bulletIndent=0)

    s['note'] = ParagraphStyle('note',
        fontName='JP', fontSize=9, textColor=GRAY,
        leading=16, spaceAfter=4, leftIndent=12)

    s['tip'] = ParagraphStyle('tip',
        fontName='JP', fontSize=10, textColor=colors.HexColor('#1B5E20'),
        leading=18, spaceAfter=4)

    s['toc'] = ParagraphStyle('toc',
        fontName='JP', fontSize=11, textColor=DARK,
        leading=22, spaceAfter=0)

    s['toc_title'] = ParagraphStyle('toc_title',
        fontName='JP-Bold', fontSize=18, textColor=PRIMARY,
        alignment=TA_CENTER, spaceBefore=0, spaceAfter=16)

    return s

# ===== ヘルパー =====
def section_header(title, st, anchor=None):
    # anchor が指定されていれば <a name="..."/> をタイトルに埋め込む
    if anchor:
        title_xml = f'<a name="{anchor}"/>{title}'
    else:
        title_xml = title
    return [
        HRFlowable(width='100%', thickness=2, color=PRIMARY, spaceAfter=4),
        Paragraph(title_xml, st['section']),
    ]

def subsection_header(title, st):
    data = [[Paragraph(title, ParagraphStyle('ss',
        fontName='JP-Bold', fontSize=12, textColor=WHITE))]]
    t = Table(data, colWidths=[None])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), ACCENT),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('ROUNDEDCORNERS', [4]),
    ]))
    return [Spacer(1, 8), t, Spacer(1, 6)]

def info_table(rows, st):
    data = [[Paragraph(k, ParagraphStyle('k', fontName='JP-Bold', fontSize=9, textColor=PRIMARY)),
             Paragraph(v, ParagraphStyle('v', fontName='JP', fontSize=10, textColor=DARK, leading=16))]
            for k, v in rows]
    t = Table(data, colWidths=[45*mm, None])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), PRIMARY_LT),
        ('BACKGROUND', (1,0), (1,-1), WHITE),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CFD8DC')),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    return [t, Spacer(1, 8)]

def tip_box(text, st):
    data = [[Paragraph('[TIP]  ' + text, ParagraphStyle('tip',
        fontName='JP-Bold', fontSize=10, textColor=colors.HexColor('#1B5E20'), leading=17))]]
    t = Table(data, colWidths=[None])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#E8F5E9')),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 7),
        ('BOTTOMPADDING', (0,0), (-1,-1), 7),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#A5D6A7')),
    ]))
    return [t, Spacer(1, 8)]

def warn_box(text, st):
    data = [[Paragraph('[注意]  ' + text, ParagraphStyle('warn',
        fontName='JP-Bold', fontSize=10, textColor=colors.HexColor('#BF360C'), leading=17))]]
    t = Table(data, colWidths=[None])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#FBE9E7')),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 7),
        ('BOTTOMPADDING', (0,0), (-1,-1), 7),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#FFAB91')),
    ]))
    return [t, Spacer(1, 8)]

# ===== 表紙（本文部分のみ。青いヘッダーはon_first_pageで描画） =====
COVER_HEADER_H = 120 * mm   # 表紙ヘッダーの高さ（on_first_pageと共有）

def cover_page(st):
    # ヘッダー分のスペース（topMarginの分を引く）
    top_margin = 25 * mm
    spacer_h = COVER_HEADER_H - top_margin

    desc = [
        Spacer(1, spacer_h),
        Spacer(1, 16),
        Paragraph(
            'ToDoトラベルは、旅行のスケジュール・スポット・移動時間・ルートメモを'
            'まとめて管理できるシンプルな旅行プランナーアプリです。',
            ParagraphStyle('desc', fontName='JP', fontSize=12, textColor=DARK,
                alignment=TA_CENTER, leading=24)),
        Spacer(1, 24),
    ]

    # 特徴カード（絵文字なしで確実に表示）
    features = [
        ['スポット管理', 'ルートメモ', '天気予報'],
        ['JSON共有', 'Excel取込', 'スマホ対応'],
    ]
    feat_style = ParagraphStyle('fs', fontName='JP', fontSize=12, textColor=PRIMARY,
        alignment=TA_CENTER, leading=20)
    feat_data = [[Paragraph(c, feat_style) for c in row] for row in features]
    feat_table = Table(feat_data, colWidths=[55*mm, 55*mm, 55*mm])
    feat_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), PRIMARY_LT),
        ('GRID', (0,0), (-1,-1), 2, WHITE),
        ('TOPPADDING', (0,0), (-1,-1), 14),
        ('BOTTOMPADDING', (0,0), (-1,-1), 14),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    desc += [feat_table]

    return desc

# ===== 目次 =====
def toc_page(st):
    items = [
        ('1', 'アプリの基本'),
        ('2', '旅行プランを作る'),
        ('3', 'スポットを登録する'),
        ('4', 'スポットの並び替えと編集'),
        ('5', '移動時間とルートメモ'),
        ('6', '写真を追加する'),
        ('7', '天気予報を確認する'),
        ('8', 'プランを保存・共有する'),
        ('9', 'Excel/CSVから一括インポート'),
        ('10', 'PDFで印刷する'),
        ('11', 'スマホで使う（PWA）'),
        ('12', 'ストレージとデータ管理'),
        ('13', 'よくある質問'),
    ]

    link_style = ParagraphStyle('tlink',
        fontName='JP', fontSize=11, textColor=PRIMARY, leading=20)

    toc_data = []
    for num, title in items:
        anchor = f'sec{num}'
        toc_data.append([
            Paragraph(num, ParagraphStyle('tn', fontName='JP-Bold', fontSize=11,
                textColor=PRIMARY, alignment=TA_CENTER)),
            Paragraph(f'<a href="#{anchor}" color="#1976D2">{title}</a>', link_style),
        ])

    toc_table = Table(toc_data, colWidths=[20*mm, None])
    toc_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), PRIMARY_LT),
        ('LINEBELOW', (0,0), (-1,-2), 0.5, colors.HexColor('#E0E0E0')),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))

    return [
        PageBreak(),
        Paragraph('目　次', st['toc_title']),
        HRFlowable(width='100%', thickness=2, color=PRIMARY, spaceAfter=14),
        toc_table,
        PageBreak(),
    ]

# ===== 本文 =====
def body_content(st):
    elems = []

    # ===== 1. アプリの基本 =====
    elems += section_header('1. アプリの基本', st, anchor='sec1')
    elems.append(Paragraph(
        'ToDoトラベルは、旅行の計画をスポット単位で管理できる無料のウェブアプリです。'
        'インストール不要でブラウザから使用でき、スマホのホーム画面にも追加できます。',
        st['body']))

    elems += info_table([
        ('アクセス方法', 'ブラウザで https://buffa99.github.io/travel-app/ を開く'),
        ('対応ブラウザ', 'Google Chrome / Microsoft Edge（推奨）、Safari、Firefox'),
        ('対応端末', 'PC・スマートフォン・タブレット'),
        ('データ保存先', 'お使いの端末のブラウザ内（クラウド保存なし）'),
    ], st)

    elems += tip_box('スマホのホーム画面に追加すると、アプリのように使えます。詳しくは「11. スマホで使う」をご覧ください。', st)

    # ===== 2. 旅行プランを作る =====
    elems += section_header('2. 旅行プランを作る', st, anchor='sec2')

    elems += subsection_header('新しいプランの作成', st)
    steps = [
        ('①', 'ホーム画面右上の「＋」ボタンをタップ'),
        ('②', 'プラン名（例：東北3県 桜旅）を入力'),
        ('③', '出発地・目的地を入力'),
        ('④', '旅行期間（出発日〜帰宅日）を選択'),
        ('⑤', '「作成」ボタンをタップ'),
    ]
    step_data = [[Paragraph(n, ParagraphStyle('sn', fontName='JP-Bold', fontSize=10,
                     textColor=WHITE, alignment=TA_CENTER)),
                  Paragraph(t, ParagraphStyle('st', fontName='JP', fontSize=10,
                     textColor=DARK, leading=18))]
                 for n, t in steps]
    step_table = Table(step_data, colWidths=[12*mm, None])
    step_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), PRIMARY),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('LINEBELOW', (0,0), (-1,-2), 0.5, colors.HexColor('#E3F2FD')),
    ]))
    elems += [step_table, Spacer(1, 10)]

    elems += subsection_header('プランの削除', st)
    elems.append(Paragraph(
        'ホーム画面のプランカードにある 🗑 アイコンをタップすると削除できます。'
        '削除したプランは元に戻せませんので、必要に応じてJSONで保存してから削除してください。',
        st['body']))

    # ===== 3. スポットを登録する =====
    elems += section_header('3. スポットを登録する', st, anchor='sec3')
    elems.append(Paragraph(
        'スポットとは、旅行中に訪れる場所（観光地・レストラン・ホテルなど）のことです。'
        '各スポットに時刻・滞在時間・住所・カテゴリ・メモ・写真を設定できます。',
        st['body']))

    elems += subsection_header('スポットの追加', st)
    steps2 = [
        ('①', 'プラン詳細画面を開き、日付タブで日程を選択'),
        ('②', '右下の「＋」（青い丸ボタン）をタップ'),
        ('③', 'カテゴリを選択（観光・グルメ・宿泊・移動・ショッピング・その他）'),
        ('④', 'スポット名・住所・時刻・滞在時間・メモを入力'),
        ('⑤', '「保存」をタップ'),
    ]
    step_data2 = [[Paragraph(n, ParagraphStyle('sn2', fontName='JP-Bold', fontSize=10,
                      textColor=WHITE, alignment=TA_CENTER)),
                   Paragraph(t, ParagraphStyle('st2', fontName='JP', fontSize=10,
                      textColor=DARK, leading=18))]
                  for n, t in steps2]
    step_table2 = Table(step_data2, colWidths=[12*mm, None])
    step_table2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), ACCENT),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('LINEBELOW', (0,0), (-1,-2), 0.5, colors.HexColor('#FFF3E0')),
    ]))
    elems += [step_table2, Spacer(1, 10)]

    elems += subsection_header('カテゴリ一覧', st)
    cat_data = [
        [Paragraph('アイコン', ParagraphStyle('ch', fontName='JP-Bold', fontSize=10, textColor=WHITE, alignment=TA_CENTER)),
         Paragraph('カテゴリ', ParagraphStyle('ch', fontName='JP-Bold', fontSize=10, textColor=WHITE, alignment=TA_CENTER)),
         Paragraph('使用例', ParagraphStyle('ch', fontName='JP-Bold', fontSize=10, textColor=WHITE, alignment=TA_CENTER))],
        ['🏛️', '観光', '神社仏閣・景勝地・美術館など'],
        ['🍽️', 'グルメ', 'レストラン・カフェ・居酒屋など'],
        ['🛍️', 'ショッピング', 'お土産店・商業施設など'],
        ['🏨', '宿泊', 'ホテル・旅館・民宿など'],
        ['🚃', '移動', '新幹線・バス・レンタカーなど'],
        ['📌', 'その他', '上記に当てはまらない場所'],
    ]
    fmt_data = []
    for i, row in enumerate(cat_data):
        if i == 0:
            fmt_data.append(row)
        else:
            fmt_data.append([
                Paragraph(row[0], ParagraphStyle('cc', fontName='JP', fontSize=14, alignment=TA_CENTER)),
                Paragraph(row[1], ParagraphStyle('cc', fontName='JP-Bold', fontSize=10, textColor=DARK)),
                Paragraph(row[2], ParagraphStyle('cc', fontName='JP', fontSize=10, textColor=DARK, leading=16)),
            ])
    cat_table = Table(fmt_data, colWidths=[20*mm, 35*mm, None])
    cat_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('BACKGROUND', (0,1), (-1,-1), WHITE),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, LIGHT_GRAY]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CFD8DC')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('ALIGN', (0,0), (0,-1), 'CENTER'),
    ]))
    elems += [cat_table, Spacer(1, 10)]

    elems += subsection_header('時刻の自動計算について', st)
    elems.append(Paragraph(
        '滞在時間（分）を設定すると、次のスポットの「着」時刻に自動で反映されます。'
        '「発」時刻に滞在時間を足した時刻が次の「着」候補になります。'
        '移動時間も考慮して手動調整することができます。',
        st['body']))
    elems += tip_box('🔄（時計マーク）ボタンを押すと、全スポットの時刻を一括で再計算できます。', st)

    # ===== 4. スポットの並び替えと編集 =====
    elems += section_header('4. スポットの並び替えと編集', st, anchor='sec4')

    elems += subsection_header('並び替え（ドラッグ）', st)
    elems.append(Paragraph(
        'スポットの左端にある「≡」マークを長押し（スマホ）またはドラッグ（PC）すると、'
        'スポットの順序を自由に変更できます。',
        st['body']))

    elems += subsection_header('スポットの編集', st)
    elems.append(Paragraph(
        'スポット名や詳細情報をタップすると詳細パネルが開きます。'
        '「✏️ 編集」ボタンから内容を変更できます。',
        st['body']))

    elems += subsection_header('スポットの削除', st)
    elems.append(Paragraph(
        'スポット詳細パネルを開き、「🗑 削除」ボタンをタップしてください。'
        '確認ダイアログが表示されますので「OK」を選択すると削除されます。',
        st['body']))

    elems += subsection_header('完了チェック', st)
    elems.append(Paragraph(
        'スポット名の左にある ○ をタップすると、そのスポットを「完了」にできます。'
        '旅行中に訪問済みのスポットにチェックを入れると進行状況が一目でわかります。',
        st['body']))

    # ===== 5. 移動時間とルートメモ =====
    elems += section_header('5. 移動時間とルートメモ', st, anchor='sec5')

    elems += subsection_header('移動時間の入力', st)
    elems.append(Paragraph(
        'スポットとスポットの間に「移動時間」の入力欄があります。'
        '移動モードを選択（公共交通・車・徒歩・待機）し、移動時間を分単位で入力します。',
        st['body']))
    elems += info_table([
        ('🚃 公共交通', '電車・バス・新幹線などでの移動'),
        ('🚗 車', '自動車・レンタカーでの移動'),
        ('🚶 徒歩', '徒歩での移動'),
        ('⏳ 待機', '移動なし（ホテルで待機など）'),
    ], st)

    elems += subsection_header('地図リンク', st)
    elems.append(Paragraph(
        '「地図を開く →」をタップすると、Google マップで目的地への経路が開きます。'
        '公共交通モードでは「路線情報を開く →」になります。',
        ParagraphStyle('body_left', parent=st['body'], alignment=TA_LEFT)))

    elems += subsection_header('ルートメモ・画像の追加', st)
    elems.append(Paragraph(
        'スポット間の移動欄にある「📋 ルートのメモ・画像を追加」をタップすると、'
        '経路の詳細メモや画像（バス・電車の時刻表、地図のスクリーンショットなど）を追加できます。',
        st['body']))
    elems += tip_box('Ctrl+V（コピー＆ペースト）でスクリーンショットを直接貼り付けることもできます。', st)

    # ===== 6. 写真を追加する =====
    elems += section_header('6. 写真を追加する', st, anchor='sec6')
    elems.append(Paragraph(
        'スポットに写真を1枚添付できます。旅行前のイメージ画像や目印となる写真を登録しておくと便利です。',
        st['body']))
    elems += info_table([
        ('追加方法①', 'スポット編集画面の写真エリアをタップしてファイルを選択'),
        ('追加方法②', 'スポット編集画面が開いている状態で Ctrl+V で貼り付け'),
        ('追加方法③', '写真エリアにファイルをドラッグ＆ドロップ'),
        ('自動圧縮', '最大1200px・JPEG品質75%に自動圧縮して保存（1枚約0.2MB）'),
    ], st)
    elems += tip_box('写真をタップすると拡大表示（ライトボックス）できます。', st)

    # ===== 7. 天気予報 =====
    elems += section_header('7. 天気予報を確認する', st, anchor='sec7')
    elems.append(Paragraph(
        '旅行開始の5日前になると、プラン詳細画面に現地の天気予報が自動表示されます。'
        'OpenWeatherMap APIを使用しており、3時間ごとの予報データを表示します。',
        st['body']))
    elems += info_table([
        ('表示条件', '旅行開始日の5日前から表示'),
        ('表示内容', '天気アイコン・気温・降水確率'),
        ('Yahoo!天気', '「Yahoo!天気で確認 →」リンクから詳細な天気確認も可能'),
    ], st)
    elems += warn_box('天気予報は旅行5日前より前には表示されません。直前に確認することをお勧めします。', st)

    # ===== 8. プランを保存・共有する =====
    elems += section_header('8. プランを保存・共有する', st, anchor='sec8')

    elems += subsection_header('JSONで保存（バックアップ）', st)
    elems.append(Paragraph(
        'プラン詳細画面右上の 💾 アイコンをタップすると、プランデータをJSONファイルとして'
        'ダウンロードできます。このファイルを保管しておけば、いつでも復元できます。',
        st['body']))
    elems += tip_box('定期的にJSONで書き出してバックアップすることをお勧めします。端末の故障・ブラウザデータ消去でデータが失われることがあります。', st)

    elems += subsection_header('QRコードで共有', st)
    elems.append(Paragraph(
        'プラン詳細画面右上の 📤 アイコン →「プランを共有」をタップすると、'
        'QRコードが表示されます。このQRコードを相手のスマホで読み取ってもらうと、'
        'プランをインポートできます。',
        st['body']))

    elems += subsection_header('JSONファイルとは？', st)
    elems.append(Paragraph(
        '「JSON（ジェイソン）」という名前を見ると難しそうに感じますが、実態は'
        '「旅プランのデータをまるごと保存したファイル」です。',
        st['body']))
    elems.append(Paragraph(
        '写真ファイル（.jpg）や文書ファイル（.docx）と同じように、'
        'LINEやメールで送ったり、スマホに保存したりできます。'
        '受け取った相手がアプリに読み込むだけで、プランがそのまま再現されます。',
        st['body']))
    elems += tip_box('JSONはバックアップにも使えます。定期的に書き出しておくと、'
        '万が一データが消えても復元できます。', st)

    elems += subsection_header('【PC】プランを保存して送る', st)
    steps_pc_send = [
        ('①', 'プラン詳細画面を開く'),
        ('②', '右上の 💾 アイコンをクリック'),
        ('③', '「〇〇.json」というファイルが自動でダウンロードされる（ダウンロードフォルダに保存）'),
        ('④', 'そのファイルをLINEのトーク画面にドラッグ＆ドロップ、またはメールに添付して送る'),
    ]
    elems.append(Paragraph('\n'.join([f'{n}　{t}' for n, t in steps_pc_send]),
        ParagraphStyle('spc', fontName='JP', fontSize=10, textColor=DARK, leading=24)))
    elems.append(Spacer(1, 6))

    elems += subsection_header('【PC】受け取ったJSONを読み込む', st)
    steps_pc_recv = [
        ('①', 'ホーム画面の 📥 アイコンをクリック'),
        ('②', '「JSONファイルを読み込む」を選択'),
        ('③', 'LINEやメールで受け取ったJSONファイルを選んで開く'),
        ('④', 'プランが自動で追加される'),
    ]
    elems.append(Paragraph('\n'.join([f'{n}　{t}' for n, t in steps_pc_recv]),
        ParagraphStyle('spcr', fontName='JP', fontSize=10, textColor=DARK, leading=24)))
    elems.append(Spacer(1, 6))

    elems += subsection_header('【スマホ（iPhone）】プランを送る', st)
    steps_ios_send = [
        ('①', 'プラン詳細画面を開く'),
        ('②', '右上の 💾 アイコンをタップ'),
        ('③', 'LINEや「ファイルに保存」などの共有メニューが開く'),
        ('④', '送りたい相手のLINEトークを選んで送信'),
    ]
    elems.append(Paragraph('\n'.join([f'{n}　{t}' for n, t in steps_ios_send]),
        ParagraphStyle('sios2', fontName='JP', fontSize=10, textColor=DARK, leading=24)))
    elems.append(Spacer(1, 6))

    elems += subsection_header('【スマホ（iPhone）】受け取ったJSONを読み込む', st)
    steps_ios_recv = [
        ('①', 'LINEでJSONファイルを長押し →「転送」→「ファイルに保存」でiPhoneに保存'),
        ('②', 'ToDoトラベルアプリを開く'),
        ('③', 'ホーム画面の 📥 アイコンをタップ →「JSONファイルを読み込む」'),
        ('④', '「ファイル」アプリから先ほど保存したJSONを選ぶ'),
        ('⑤', 'プランが追加される'),
    ]
    elems.append(Paragraph('\n'.join([f'{n}　{t}' for n, t in steps_ios_recv]),
        ParagraphStyle('siosr', fontName='JP', fontSize=10, textColor=DARK, leading=24)))
    elems.append(Spacer(1, 6))

    elems += subsection_header('【スマホ（Android）】プランを送る・受け取る', st)
    steps_and_send = [
        ('送る', '💾 アイコンをタップ → LINEや「共有」メニューから送信'),
        ('受け取る', 'LINEで受信したファイルをタップ →「他のアプリで開く」→ ToDoトラベルを選ぶ'),
        ('補足', 'アプリ選択肢に出ない場合は、一度「ダウンロード」フォルダに保存してからアプリの 📥 で読み込む'),
    ]
    elems.append(Paragraph('\n'.join([f'{n}　{t}' for n, t in steps_and_send]),
        ParagraphStyle('sand2', fontName='JP', fontSize=10, textColor=DARK, leading=24)))
    elems.append(Spacer(1, 6))

    elems += warn_box(
        'JSONファイルを受け取ったあと、ファイルが見つからない場合は「ダウンロード」フォルダを確認してください。'
        'iPhoneは「ファイル」アプリ、Androidは「マイファイル」または「Files」アプリで探せます。', st)

    # ===== 9. Excel/CSVインポート =====
    elems += section_header('9. Excel/CSVから一括インポート', st, anchor='sec9')
    elems.append(Paragraph(
        'あらかじめExcelやCSVでスポット情報を用意しておけば、一括で読み込むことができます。',
        st['body']))
    elems += info_table([
        ('対応形式', '.xlsx（Excel）/ .csv / .tsv'),
        ('アクセス', 'ホーム画面の 📥 → 「ExcelやCSVから読み込む」'),
        ('列の形式', 'スポット名・住所・日付・時刻・カテゴリなどを列で指定'),
    ], st)
    elems += tip_box('Excelのテンプレートに従って入力すると、読み込みがスムーズです。', st)

    # ===== 10. PDFで印刷する =====
    elems += section_header('10. PDFで印刷する', st, anchor='sec10')
    elems.append(Paragraph(
        'プラン詳細画面右上の 🖨️ アイコンをタップすると、その日の旅程をPDF形式で印刷・保存できます。'
        '旅行中に紙で持ち歩きたい場合に便利です。',
        st['body']))
    elems += info_table([
        ('出力内容', '選択中の日付の全スポット（時刻・場所・メモ・移動情報）'),
        ('操作', '🖨️ ボタン → ブラウザの印刷ダイアログ → 「PDFに保存」を選択'),
    ], st)

    # ===== 11. スマホで使う =====
    elems += section_header('11. スマホで使う（PWA）', st, anchor='sec11')
    elems.append(Paragraph(
        'ToDoトラベルはPWA（Progressive Web App）対応のため、スマホのホーム画面に追加すると'
        'アプリのように使えます。',
        st['body']))

    elems += subsection_header('iPhoneへの追加方法', st)
    steps_ios = [
        ('①', 'Safari で https://buffa99.github.io/travel-app/ を開く'),
        ('②', '画面下部の「共有」ボタン（□↑マーク）をタップ'),
        ('③', '「ホーム画面に追加」をタップ'),
        ('④', '「追加」をタップして完了'),
    ]
    elems.append(Paragraph('\n'.join([f'{n} {t}' for n, t in steps_ios]),
        ParagraphStyle('sios', fontName='JP', fontSize=10, textColor=DARK, leading=22)))
    elems.append(Spacer(1, 8))

    elems += subsection_header('Androidへの追加方法', st)
    steps_and = [
        ('①', 'Chrome で https://buffa99.github.io/travel-app/ を開く'),
        ('②', '右上のメニュー（⋮）をタップ'),
        ('③', '「ホーム画面に追加」をタップ'),
        ('④', '「追加」をタップして完了'),
    ]
    elems.append(Paragraph('\n'.join([f'{n} {t}' for n, t in steps_and]),
        ParagraphStyle('sand', fontName='JP', fontSize=10, textColor=DARK, leading=22)))
    elems.append(Spacer(1, 8))
    elems += warn_box('PWAとして追加するとオフラインでも閲覧できますが、データはブラウザ内に保存されます。端末を変えた場合はJSONでインポートが必要です。', st)

    # ===== 12. ストレージとデータ管理 =====
    elems += section_header('12. ストレージとデータ管理', st, anchor='sec12')
    elems.append(Paragraph(
        'ホーム画面上部のバーでストレージ使用量を確認できます。',
        st['body']))

    elems += info_table([
        ('テキストデータ', 'ブラウザのlocalStorage（上限 約5MB）に保存'),
        ('写真・画像', 'IndexedDB（数百MB〜GB）に保存。localStorageには影響しない'),
        ('メーターの色', '緑：余裕あり　オレンジ：注意　赤：ほぼ満杯'),
    ], st)

    elems += subsection_header('容量が少なくなったら', st)
    steps_storage = [
        ('①', '💾 でJSONファイルをバックアップ保存'),
        ('②', '🗑 でプランを削除（容量が解放される）'),
        ('③', '必要になったら 📥 でJSONをインポートして復元'),
    ]
    elems.append(Paragraph('\n'.join([f'{n} {t}' for n, t in steps_storage]),
        ParagraphStyle('sstr', fontName='JP', fontSize=10, textColor=DARK, leading=22)))
    elems.append(Spacer(1, 8))
    elems += tip_box('写真データはIndexedDBに保存されるため、localStorageの容量を圧迫しません。写真を何枚追加してもバーの数値はほとんど変わりません。', st)

    # ===== 13. よくある質問 =====
    elems += section_header('13. よくある質問', st, anchor='sec13')

    faqs = [
        ('スマホを機種変更したらデータは？',
         'データは端末のブラウザ内に保存されています。機種変更前にJSONで書き出しておき、新しいスマホでインポートしてください。'),
        ('複数人でプランを共有したい',
         'QRコードまたはJSONファイルで共有できます。ただし、共有後の変更は自動同期されません。変更のたびに再共有が必要です。'),
        ('日程や旅行期間を変更したい',
         'ホーム画面でプランカードを長押し（またはメニュー ⋮）すると編集できます。'),
        ('天気予報が表示されない',
         '旅行開始日の5日前からのみ表示されます。また、インターネット接続が必要です。'),
        ('写真が表示されない',
         '一度アプリを再読み込みしてください。写真はIndexedDBに保存されており、初回ロード時に読み込まれます。'),
        ('データが消えてしまった',
         'ブラウザのキャッシュ/履歴を削除するとデータも消える場合があります。定期的なJSONバックアップを強くお勧めします。'),
    ]

    for q, a in faqs:
        q_data = [[Paragraph('Q. ' + q, ParagraphStyle('fq',
            fontName='JP-Bold', fontSize=10, textColor=PRIMARY))]]
        a_data = [[Paragraph('A. ' + a, ParagraphStyle('fa',
            fontName='JP', fontSize=10, textColor=DARK, leading=17))]]
        q_table = Table(q_data, colWidths=[None])
        q_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), PRIMARY_LT),
            ('LEFTPADDING', (0,0), (-1,-1), 10),
            ('RIGHTPADDING', (0,0), (-1,-1), 10),
            ('TOPPADDING', (0,0), (-1,-1), 7),
            ('BOTTOMPADDING', (0,0), (-1,-1), 7),
        ]))
        a_table = Table(a_data, colWidths=[None])
        a_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), WHITE),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CFD8DC')),
            ('LEFTPADDING', (0,0), (-1,-1), 10),
            ('RIGHTPADDING', (0,0), (-1,-1), 10),
            ('TOPPADDING', (0,0), (-1,-1), 7),
            ('BOTTOMPADDING', (0,0), (-1,-1), 7),
        ]))
        elems += [KeepTogether([q_table, a_table]), Spacer(1, 8)]

    return elems

# ===== ページヘッダー・フッター =====
def on_page(canvas, doc):
    canvas.saveState()
    w, h = A4

    # ヘッダー
    canvas.setFillColor(PRIMARY)
    canvas.rect(0, h - 18*mm, w, 18*mm, fill=1, stroke=0)
    canvas.setFont('JP-Bold', 10)
    canvas.setFillColor(WHITE)
    canvas.drawString(15*mm, h - 11*mm, '✈️ ToDoトラベル 使用マニュアル')

    # フッター
    canvas.setFillColor(LIGHT_GRAY)
    canvas.rect(0, 0, w, 12*mm, fill=1, stroke=0)
    canvas.setFont('JP', 9)
    canvas.setFillColor(GRAY)
    canvas.drawString(15*mm, 4*mm, 'https://buffa99.github.io/travel-app/')
    canvas.drawRightString(w - 15*mm, 4*mm, f'- {doc.page} -')

    canvas.restoreState()

def on_first_page(canvas, doc):
    canvas.saveState()
    w, h = A4
    hh = COVER_HEADER_H   # ヘッダー高さ

    # ===== 青いヘッダー背景 =====
    canvas.setFillColor(PRIMARY)
    canvas.rect(0, h - hh, w, hh, fill=1, stroke=0)

    # 下部に濃いアクセント帯
    canvas.setFillColor(colors.HexColor('#1565C0'))
    canvas.rect(0, h - hh, w, 10*mm, fill=1, stroke=0)

    # ===== タイトル文字列（中央揃え） =====
    cx = w / 2

    # メインタイトル
    canvas.setFont('JP-Bold', 36)
    canvas.setFillColor(WHITE)
    canvas.drawCentredString(cx, h - 52*mm, 'ToDoトラベル')

    # サブタイトル
    canvas.setFont('JP', 17)
    canvas.setFillColor(colors.HexColor('#BBDEFB'))
    canvas.drawCentredString(cx, h - 70*mm, '使 用 マ ニ ュ ア ル')

    # バージョン
    canvas.setFont('JP', 10)
    canvas.setFillColor(colors.HexColor('#90CAF9'))
    canvas.drawCentredString(cx, h - 85*mm, '2026年3月版')

    # 区切り線
    canvas.setStrokeColor(colors.HexColor('#42A5F5'))
    canvas.setLineWidth(1)
    canvas.line(30*mm, h - hh + 12*mm, w - 30*mm, h - hh + 12*mm)

    # ===== フッター =====
    canvas.setFillColor(LIGHT_GRAY)
    canvas.rect(0, 0, w, 12*mm, fill=1, stroke=0)
    canvas.setFont('JP', 9)
    canvas.setFillColor(GRAY)
    canvas.drawString(15*mm, 4*mm, 'https://buffa99.github.io/travel-app/')
    canvas.drawRightString(w - 15*mm, 4*mm, '- 1 -')
    canvas.restoreState()

# ===== メイン =====
def main():
    output_path = r'C:\Users\SG030\OneDrive\☆★☆★ToDoトラベル\travel-app\manual.pdf'

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=20*mm, rightMargin=20*mm,
        topMargin=25*mm, bottomMargin=20*mm,
        title='ToDoトラベル 使用マニュアル',
        author='ToDoトラベル',
        subject='旅行プランナーアプリの使い方',
    )

    st = make_styles()
    story = []

    # 表紙
    story += cover_page(st)

    # 目次
    story += toc_page(st)

    # 本文
    story += body_content(st)

    doc.build(story,
              onFirstPage=on_first_page,
              onLaterPages=on_page)

    print(f'PDF complete: {output_path}')

if __name__ == '__main__':
    main()
