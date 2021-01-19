import { find, findAll, QueryError } from '../';
import '../extend-expect';

beforeEach(async () => {
  await html``;
});

it('should find elements', async () => {
  await html`
    <button>Button 1</button>
    <button>Button 2</button>
  `;

  const buttons = await findAll({ role: 'button' });

  expect(buttons.length).toBe(2);

  const button1 = await find({ role: 'button', name: 'Button 1' });
  const button2 = await find({ role: 'button', name: /button 2/i });

  await expect(button1).toMatchQuery({
    name: /button 1/i,
  });
  await expect(button2).toMatchQuery({
    name: 'Button 2',
  });

  await expect(buttons[0]).toBeElement(button1);
  await expect(buttons[1]).toBeElement(button2);

  await html`
    <label for="username">Username</label>
    <input id="username" />
  `;

  const input = await find({ role: 'textbox', name: 'Username' });
  await expect(input).toMatchQuery({ selector: '#username' });

  await input.type('My name');

  await expect(input).toMatchQuery({ value: 'My name' });

  await html`
    <section aria-labelledby="section-a">
      <h2 id="section-a">Section A</h2>
      <div role="group">A</div>
    </section>
    <section aria-labelledby="section-b">
      <h2 id="section-b">Section B</h2>
      <div role="group">B</div>
    </section>
    <div role="group">C</div>
  `;

  const sectionA = await find({ role: 'region', name: 'Section A' });
  const groupA = await find({ role: 'group' }, { root: sectionA });

  await expect(groupA).toMatchQuery({ text: 'A' });
});

it('should find elements eventually within timeout', async () => {
  const findButtonPromise = find({ role: 'button' });

  await html`<button>Button</button>`;

  const button = await findButtonPromise;

  await expect(button).toMatchQuery({ name: 'Button' });

  await html``;

  const findAllButtonsPromise = findAll({ role: 'button' });

  await html`
    <button>Button 1</button>
    <button>Button 2</button>
  `;

  const buttons = await findAllButtonsPromise;

  await expect(buttons[0]).toMatchQuery({ name: 'Button 1' });
  await expect(buttons[1]).toMatchQuery({ name: /button 2/i });
});

it('should throw errors when the elements are not found', async () => {
  try {
    await findAll({ role: 'button' }, { timeout: 0 });
  } catch (err) {
    expect(err).toBeInstanceOf(QueryError);
    expect(err.name).toBe('QueryEmptyError');
  }

  try {
    await find({ role: 'button' }, { timeout: 10 });
  } catch (err) {
    expect(err).toBeInstanceOf(QueryError);
    expect(err.name).toBe('QueryTimeoutError');
  }

  await html`
    <button>button 1</button>
    <button>button 2</button>
  `;

  try {
    await find({ role: 'button' });
  } catch (err) {
    expect(err).toBeInstanceOf(QueryError);
    expect(err.name).toBe('QueryMultipleError');
  }
});

async function html(strings: TemplateStringsArray) {
  const string = strings.join('');

  await page.evaluate((_html) => {
    document.body.innerHTML = _html;
  }, string);
}
