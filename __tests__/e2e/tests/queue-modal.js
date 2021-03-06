const { WEB_ORIGIN } = require('../constants')

module.exports = {
  before: function (browser) {
      browser
        ._resetDatabase()
        .url(`${WEB_ORIGIN}/`)

  },
  'Queue Modal': function (browser) {
    browser
      
      .click(`.mp-header__queue`)
      .waitForElementWithText(`.media-list__container:nth-child(2) .media-list__item .media-list-item-a__title`, `Amet aliquam id diam maecenas ultricies mi eget.`)

      .waitForElementWithText(`.scrollable-area div[data-rbd-draggable-id="secondary-item-1"] .media-list-item-a__title`,`Egestas egestas fringilla phasellus faucibus.`)
      
      .click(`.queue-modal-header__edit .btn.btn-secondary`)

      .click(`.scrollable-area div[data-rbd-draggable-id="secondary-item-1"] .media-list-right__remove`)

      .waitForElementWithText(`.scrollable-area div[data-rbd-draggable-id="secondary-item-1"] .media-list-item-a__title`,`Dignissim diam quis enim lobortis scelerisque fermentum dui faucibus in.`)

  },
  after: function (browser) {
      browser.end()
  }
}
