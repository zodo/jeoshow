import { test } from 'vitest'
import { SiqXmlContentParser } from './xml-parser'

test('converts XML to pack model', () => {
	const converter = new SiqXmlContentParser(xml, 'id', {
		'photo_2024-03-07_21-45-26_1.jpg': 'another link',
	})
	const pack = converter.convert()
	console.log(JSON.stringify(pack, null, 2))
})

const xml = `<?xml version="1.0" encoding="utf-8"?>
<package name="Экологическое право" version="5" id="9bdb8b1b-f03e-4cfa-8bbc-3ad05ae7c781"
    date="05.12.2023" difficulty="5"
    xmlns="https://github.com/VladimirKhil/SI/blob/master/assets/siq_5.xsd">
    <info>
        <authors>
            <author>Студенты группы 1120СОН4 </author>
        </authors>
    </info>
    <rounds>
        <round name="1-й раунд">
            <themes>
                <theme name="&quot;Коммерция&quot; в экологическом праве">
                    <questions>
                        <question price="200">
                            <params>
                                <param name="question" type="content">
                                    <item duration="00:00:10">Каким НПА регламентируется передача
                                        недр для выработки драгоценных металлов?</item>
                                </param>
                            </params>
                            <right>
                                <answer>Федеральный закон № 41-ФЗ от 26.03.1998 «О драгоценных
                                    металлах и драгоценных камнях»</answer>
                            </right>
                        </question>
                        <question price="300">
                            <params>
                                <param name="question" type="content">
                                    <item duration="00:00:15">Экологический аудит это?</item>
                                </param>
                            </params>
                            <right>
                                <answer>независимая, комплексная, документированная оценка
                                    соблюдения юридическим лицом или индивидуальным предпринимателем
                                    требований, в том числе нормативов и нормативных документов,
                                    федеральных норм и правил, в области охраны окружающей среды,
                                    требований международных стандартов и подготовка рекомендаций по
                                    улучшению такой деятельности</answer>
                            </right>
                        </question>
                    </questions>
                </theme>
                <theme name="Это база - это знать надо">
                    <questions>
                        <question price="100" type="noRisk">
                            <params>
								<param name="question" type="content">
								<item>назовите игру из игротеки по картинке</item>
								<item type="image" isRef="True">photo_2024-03-07_21-45-26_1.jpg</item>
							</param>
                            </params>
                            <right>
                                <answer>да</answer>
                            </right>
                        </question>
                        <question price="50">
                            <params>
                                <param name="question" type="content">
                                    <item>Федеральный закон от 10.01.2002 N 7-ФЗ, назовите полное
                                        наименование закона</item>
                                </param>
                            </params>
                            <right>
                                <answer>Федеральный закон "Об охране окружающей среды" от 10.01.2002
                                    N 7-ФЗ</answer>
                            </right>
                        </question>
                    </questions>
                </theme>
            </themes>
        </round>
        <round name="ФИНАЛ" type="final">
            <themes>
                <theme name="Сопромат от &quot;мира экологического права&quot;">
                    <questions>
                        <question price="600" type="stake">
                            <params>
                                <param name="question" type="content">
                                    <item>В каких случаях не требуется лицензирование на
                                        недропользование?</item>
                                </param>
                            </params>
                            <right>
                                <answer>Согласно законодательству, лицензия требуется, если объем
                                    извлекаемых подземных вод превышает 100 кубических метров в
                                    сутки, если добыча воды ведется в коммерческих целях, а также
                                    если источник водозабора располагается ниже водоносного
                                    горизонта, который служит источником централизованного
                                    водоснабжения. </answer>
                            </right>
                        </question>
                    </questions>
                </theme>
                <theme name="Разрешите представиться, уполномоченный......">
                    <questions>
                        <question price="100">
                            <params>
                                <param name="question" type="content">
                                    <item>Назовите хотя бы 1 государственный орган уполномоченный
                                        оказывать услуги в сфере природопользования (за каждый по
                                        100 баллов)</item>
                                </param>
                            </params>
                            <right>
                                <answer>Росприроднадзор, минприроды и другие </answer>
                            </right>
                        </question>
						<question price="800">
							<params>
								<param name="question" type="content">
									<item></item>
								</param>
							</params>
							<right>
								<answer />
							</right>
						</question>
						<question price="200">
						<info>
							<comments>Он был завершен 31 марта 1889 г.</comments>
						</info>
						<params>
							<param name="question" type="content">
								<item>Строительство Эйфелевой башни было завершено 31 марта 1887
									года.</item>
							</param>
							<param name="answerType">select</param>
							<param name="answerOptions" type="group">
								<param name="A" type="content">
									<item>Правда</item>
								</param>
								<param name="B" type="content">
									<item>Ложь</item>
								</param>
							</param>
						</params>
						<right>
							<answer>B</answer>
						</right>
					</question>
                    </questions>
                </theme>
				<theme name="">
				<questions>
					<question price="100">
						<params>
							<param name="question" type="content">
								<item></item>
							</param>
						</params>
						<right>
							<answer />
						</right>
					</question>
				</questions>
			</theme>
            </themes>
        </round>
    </rounds>
</package>
`
